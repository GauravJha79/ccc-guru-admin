/**
 * Hygraph GraphQL Client for CCCGuru.in Next.js Frontend
 * Handles bilingual blog queries, counterpart translation resolution, and ISR cache tags.
 */

const HYGRAPH_ENDPOINT =
  process.env.NEXT_PUBLIC_HYGRAPH_CONTENT_API ||
  'https://api-ap-south-1.hygraph.com/v2/cmuf38sab01kc06w5gj3n7eyk/master';

const HYGRAPH_AUTH_TOKEN = process.env.HYGRAPH_AUTH_TOKEN || '';

export type SupportedLocale = 'en' | 'hi';

export interface Author {
  name: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
}

export interface Category {
  name: string;
  nameHi?: string;
  slug: string;
}

export interface LinkedPostSummary {
  id: string;
  slug: string;
  language: 'EN' | 'HI';
  title: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  language: 'EN' | 'HI';
  translationGroupId: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  author?: Author;
  category?: Category;
  counterpart?: LinkedPostSummary | null;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function fetchHygraph<T>(
  query: string,
  variables: Record<string, any> = {},
  options: { revalidate?: number | false; tags?: string[] } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (HYGRAPH_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${HYGRAPH_AUTH_TOKEN}`;
  }

  const res = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    next: {
      revalidate: options.revalidate !== undefined ? options.revalidate : 3600, // 1 hour default ISR
      tags: options.tags || ['blogs'],
    },
  });

  if (!res.ok) {
    throw new Error(`Hygraph GraphQL HTTP error ${res.status}: ${res.statusText}`);
  }

  const json: GraphQLResponse<T> = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Hygraph GraphQL Error: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  return json.data as T;
}

/**
 * Fetches a single published post by slug and locale.
 * Automatically looks up the published counterpart in the other language via translationGroupId.
 */
export async function getPostBySlugAndLocale(
  slug: string,
  locale: SupportedLocale
): Promise<BlogPost | null> {
  const languageEnum = locale === 'hi' ? 'HI' : 'EN';
  const oppositeEnum = locale === 'hi' ? 'EN' : 'HI';

  const query = `
    query GetPostDetails($slug: String!, $language: ArticleLanguage!) {
      posts(where: { slug: $slug, language: $language }, stage: PUBLISHED, first: 1) {
        id
        title
        slug
        language
        translationGroupId
        content
        excerpt
        metaTitle
        metaDescription
        featuredImage
        featuredImageAlt
        isFeatured
        publishedAt
        createdAt
        updatedAt
        author {
          name
          avatarUrl
          bio
          role
        }
        category {
          name
          nameHi
          slug
        }
      }
    }
  `;

  const data = await fetchHygraph<{ posts: BlogPost[] }>(
    query,
    { slug, language: languageEnum },
    { tags: [`post-${slug}`, 'blogs'] }
  );

  const post = data.posts?.[0];
  if (!post) return null;

  // If translationGroupId exists, lookup the published counterpart in the opposite language
  if (post.translationGroupId) {
    const counterpartQuery = `
      query GetCounterpart($translationGroupId: String!, $oppositeLang: ArticleLanguage!) {
        posts(
          where: { translationGroupId: $translationGroupId, language: $oppositeLang },
          stage: PUBLISHED,
          first: 1
        ) {
          id
          title
          slug
          language
        }
      }
    `;

    try {
      const counterpartData = await fetchHygraph<{ posts: LinkedPostSummary[] }>(
        counterpartQuery,
        {
          translationGroupId: post.translationGroupId,
          oppositeLang: oppositeEnum,
        },
        { tags: [`tg-${post.translationGroupId}`] }
      );

      post.counterpart = counterpartData.posts?.[0] || null;
    } catch (err) {
      console.warn('Failed to resolve counterpart translation:', err);
      post.counterpart = null;
    }
  }

  return post;
}

/**
 * Returns all published slugs with their locale for static pre-rendering (generateStaticParams).
 */
export async function getAllPublishedBlogSlugs(): Promise<
  Array<{ slug: string; locale: SupportedLocale }>
> {
  const query = `
    query GetAllBlogSlugs {
      posts(stage: PUBLISHED, first: 1000) {
        slug
        language
      }
    }
  `;

  const data = await fetchHygraph<{ posts: Array<{ slug: string; language: 'EN' | 'HI' }> }>(
    query,
    {},
    { revalidate: 3600, tags: ['blogs'] }
  );

  return (data.posts || []).map((p) => ({
    slug: p.slug,
    locale: p.language === 'HI' ? 'hi' : 'en',
  }));
}
