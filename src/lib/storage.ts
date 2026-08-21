import { supabase, isSupabaseConfigured } from './supabase';

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export async function uploadFileToSupabase(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  if (isSupabaseConfigured && supabase) {
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload to storage failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  }

  // Fallback for local demo/mock mode: create an Object URL or data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        fileName: file.name,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}
