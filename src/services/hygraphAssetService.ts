import { hygraphRequest } from '../lib/hygraph';

export interface HygraphAssetUploadResult {
  id: string;
  url: string;
  fileName: string;
  size?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

interface S3UploadPostData {
  url: string;
  date: string;
  key: string;
  signature: string;
  algorithm: string;
  policy: string;
  credential: string;
  securityToken?: string | null;
}

interface CreateAssetResponse {
  createAsset: {
    id: string;
    url: string;
    upload?: {
      status: string;
      error?: {
        code: string;
        message: string;
      } | null;
      requestPostData?: S3UploadPostData | null;
    } | null;
  };
}

interface PublishAssetResponse {
  publishAsset: {
    id: string;
    url: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
    stage?: string;
  };
}

/**
 * Sanitizes a filename to prevent S3 key encoding or special character issues.
 */
function sanitizeFileName(fileName: string): string {
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const base = parts.join('.');
  const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  const safeExt = (ext || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${Date.now()}-${safeBase || 'image'}.${safeExt}`;
}

/**
 * Uploads a local File or Blob directly to Hygraph Assets.
 * Uses the modern Hygraph GraphQL Asset Creation + Signed S3 Multipart POST + Auto-Publish workflow.
 *
 * @param file The File or Blob to upload
 * @param customFileName Optional explicit file name (useful when uploading raw Blobs)
 * @returns HygraphAssetUploadResult containing asset ID and public graphassets CDN URL
 */
export async function uploadAssetToHygraph(
  file: File | Blob,
  customFileName?: string
): Promise<HygraphAssetUploadResult> {
  const originalName = customFileName || (file instanceof File ? file.name : 'asset.png');
  const safeFileName = sanitizeFileName(originalName);

  // Step 1: Request S3 upload signature from Hygraph Content API
  const createAssetMutation = `
    mutation CreateAssetEntry {
      createAsset(data: {}) {
        id
        url
        upload {
          status
          error {
            code
            message
          }
          requestPostData {
            url
            date
            key
            signature
            algorithm
            policy
            credential
            securityToken
          }
        }
      }
    }
  `;

  let createRes: CreateAssetResponse;
  try {
    createRes = await hygraphRequest<CreateAssetResponse>(createAssetMutation);
  } catch (err: any) {
    console.error('Hygraph createAsset mutation failed:', err);
    throw new Error(`Failed to initiate Hygraph asset upload: ${err.message || String(err)}`);
  }

  const asset = createRes.createAsset;
  const postData = asset.upload?.requestPostData;

  if (!postData || !postData.url) {
    const errorMsg = asset.upload?.error?.message || 'No upload signature returned by Hygraph.';
    throw new Error(`Hygraph asset initialization failed: ${errorMsg}`);
  }

  // Step 2: Upload file binary directly to signed AWS S3 destination
  const formData = new FormData();
  const s3Key = postData.key.replace('${filename}', safeFileName);

  formData.append('key', s3Key);
  formData.append('x-amz-algorithm', postData.algorithm);
  formData.append('x-amz-credential', postData.credential);
  formData.append('x-amz-date', postData.date);
  formData.append('policy', postData.policy);
  formData.append('x-amz-signature', postData.signature);

  if (postData.securityToken) {
    formData.append('x-amz-security-token', postData.securityToken);
  }

  // File blob MUST be appended last for AWS S3 multipart POST requests
  formData.append('file', file, safeFileName);

  const s3Response = await fetch(postData.url, {
    method: 'POST',
    body: formData,
  });

  if (!s3Response.ok && s3Response.status !== 204 && s3Response.status !== 201) {
    const errorText = await s3Response.text().catch(() => '');
    console.error('S3 direct upload failed:', s3Response.status, errorText);
    throw new Error(`Failed to upload asset binary to Hygraph storage (HTTP ${s3Response.status}).`);
  }

  // Step 3: Publish asset so it is immediately accessible on the global graphassets CDN
  try {
    // Short grace delay to allow Hygraph S3 ingestion worker to register file headers
    await new Promise((resolve) => setTimeout(resolve, 800));

    const publishMutation = `
      mutation PublishAssetEntry($id: ID!) {
        publishAsset(where: { id: $id }, to: [PUBLISHED]) {
          id
          url
          fileName
          mimeType
          size
          stage
        }
      }
    `;

    await hygraphRequest<PublishAssetResponse>(publishMutation, { id: asset.id });
  } catch (pubErr) {
    // Non-fatal: Asset is uploaded, even if publish stage takes an extra second
    console.warn('Hygraph asset auto-publish notice (draft URL active):', pubErr);
  }

  return {
    id: asset.id,
    url: asset.url,
    fileName: safeFileName,
    size: file.size,
    mimeType: file.type || 'image/png',
  };
}

/**
 * Uploads a base64 encoded image string (or data: URL) to Hygraph Assets.
 */
export async function uploadBase64ImageToHygraph(
  base64Data: string,
  fileNameHint: string = 'ai-banner'
): Promise<HygraphAssetUploadResult> {
  let mime = 'image/png';
  let cleanBase64 = base64Data;

  const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUriMatch) {
    mime = dataUriMatch[1];
    cleanBase64 = dataUriMatch[2];
  }

  const byteCharacters = atob(cleanBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mime });

  const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const file = new File([blob], `${fileNameHint}.${ext}`, { type: mime });

  return uploadAssetToHygraph(file);
}

/**
 * Uploads an image from an external public URL into Hygraph Assets.
 */
export async function uploadRemoteImageToHygraph(
  remoteUrl: string,
  fileNameHint: string = 'remote-image'
): Promise<HygraphAssetUploadResult> {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote image from ${remoteUrl} (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

  const file = new File([blob], `${fileNameHint}.${ext}`, { type: contentType });
  return uploadAssetToHygraph(file);
}
