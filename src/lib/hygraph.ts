export const HYGRAPH_ENDPOINT =
  import.meta.env.VITE_HYGRAPH_CONTENT_API ||
  'https://api-ap-south-1.hygraph.com/v2/cmuf38sab01kc06w5gj3n7eyk/master';

export const HYGRAPH_AUTH_TOKEN =
  import.meta.env.VITE_HYGRAPH_AUTH_TOKEN || '';

export const isHygraphConfigured = Boolean(
  HYGRAPH_ENDPOINT && HYGRAPH_ENDPOINT.startsWith('http')
);

export interface HygraphGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
}

/**
 * Execute a GraphQL query or mutation against Hygraph Content API
 */
export async function hygraphRequest<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  if (!isHygraphConfigured) {
    throw new Error('Hygraph Content API endpoint is not configured in .env');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (HYGRAPH_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${HYGRAPH_AUTH_TOKEN}`;
  }

  const response = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Hygraph HTTP Error (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  const json: HygraphGraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    const errorMsg = json.errors.map((e) => e.message).join('; ');
    throw new Error(`Hygraph GraphQL Error: ${errorMsg}`);
  }

  if (!json.data) {
    throw new Error('Hygraph GraphQL returned empty data response');
  }

  return json.data;
}
