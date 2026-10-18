import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPostBySlugAndLocale,
  getAllPublishedBlogSlugs,
  SupportedLocale,
} from '@/lib/hygraph';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cccguru.in';

/**
 * Generates static params for all published blog posts across EN and HI.
 */
export async function generateStaticParams() {
  const posts = await getAllPublishedBlogSlugs();
  return posts.map((post) => ({
    locale: post.locale,
    slug: post.slug,
  }));
}

/**
 * Dynamic SEO Metadata Generator
 * Generates canonical tags and strict reciprocal hreflang links.
 * If the counterpart language translation is unpublished/draft, it omits the reciprocal link
 * to prevent Google 404 indexing errors.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== 'en' && locale !== 'hi') {
    return {};
  }

  const post = await getPostBySlugAndLocale(slug, locale as SupportedLocale);
  if (!post) {
    return {
      title: 'Article Not Found | CCCGuru.in',
      robots: { index: false, follow: false },
    };
  }

  const currentUrl = `${SITE_URL}/${locale}/blogs/${slug}`;
  const metaTitle = post.metaTitle || post.title;
  const metaDesc =
    post.metaDescription ||
    post.excerpt ||
    'Prepare for NIELIT CCC 2026 Examination with CCCGuru comprehensive study notes and practice papers.';

  // Build strict reciprocal hreflang alternates
  const languageAlternates: Record<string, string> = {
    [locale]: currentUrl,
  };

  if (locale === 'en') {
    // English page
    languageAlternates['x-default'] = currentUrl;
    if (post.counterpart) {
      languageAlternates['hi'] = `${SITE_URL}/hi/blogs/${post.counterpart.slug}`;
    }
  } else {
    // Hindi page
    if (post.counterpart) {
      const englishUrl = `${SITE_URL}/en/blogs/${post.counterpart.slug}`;
      languageAlternates['en'] = englishUrl;
      languageAlternates['x-default'] = englishUrl;
    } else {
      // If Hindi-only article with no English version, self-refer x-default
      languageAlternates['x-default'] = currentUrl;
    }
  }

  return {
    title: `${metaTitle} | CCCGuru.in`,
    description: metaDesc,
    alternates: {
      canonical: currentUrl,
      languages: languageAlternates,
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: currentUrl,
      siteName: 'CCCGuru.in',
      locale: locale === 'hi' ? 'hi_IN' : 'en_US',
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt || post.publishedAt || post.createdAt,
      authors: post.author?.name ? [post.author.name] : ['CCCGuru Expert Team'],
      images: post.featuredImage
        ? [
            {
              url: post.featuredImage,
              width: 1200,
              height: 630,
              alt: post.featuredImageAlt || post.title,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDesc,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

/**
 * Server Component: Blog Article Page
 */
export default async function BlogDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (locale !== 'en' && locale !== 'hi') {
    notFound();
  }

  const post = await getPostBySlugAndLocale(slug, locale as SupportedLocale);
  if (!post) {
    notFound();
  }

  const currentUrl = `${SITE_URL}/${locale}/blogs/${slug}`;

  // Structured Data (Schema.org / JSON-LD)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    inLanguage: locale === 'hi' ? 'hi-IN' : 'en-US',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl,
    },
    author: {
      '@type': 'Person',
      name: post.author?.name || 'CCCGuru Editorial Team',
      url: `${SITE_URL}/authors/${post.author?.name ? post.author.name.toLowerCase().replace(/\s+/g, '-') : 'ccc-team'}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CCCGuru.in',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'hi' ? 'मुख्य पृष्ठ' : 'Home',
        item: `${SITE_URL}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'hi' ? 'ब्लॉग्स' : 'Blogs',
        item: `${SITE_URL}/${locale}/blogs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: currentUrl,
      },
    ],
  };

  return (
    <>
      {/* Schema.org Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-400">
            <Link href={`/${locale}`} className="hover:text-indigo-400">
              {locale === 'hi' ? 'होम' : 'Home'}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/blogs`} className="hover:text-indigo-400">
              {locale === 'hi' ? 'ब्लॉग्स' : 'Blogs'}
            </Link>
            <span>/</span>
            <span className="text-slate-300 truncate max-w-xs">{post.title}</span>
          </nav>

          {/* Language Switcher Bar */}
          <div className="mb-8 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {locale.toUpperCase()}
              </span>
              <span>
                {locale === 'hi'
                  ? 'आप यह लेख हिंदी में पढ़ रहे हैं।'
                  : 'You are reading this article in English.'}
              </span>
            </div>

            {post.counterpart ? (
              <Link
                href={`/${locale === 'hi' ? 'en' : 'hi'}/blogs/${post.counterpart.slug}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
              >
                <span>🌐</span>
                <span>
                  {locale === 'hi'
                    ? 'Read in English'
                    : 'हिंदी में पढ़ें (Read in Hindi)'}
                </span>
              </Link>
            ) : (
              <span className="text-xs text-slate-500 italic">
                {locale === 'hi'
                  ? 'अंग्रेजी अनुवाद जल्द उपलब्ध होगा।'
                  : 'Hindi translation coming soon.'}
              </span>
            )}
          </div>

          {/* Header */}
          <header className="mb-8">
            {post.category && (
              <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                {locale === 'hi' && post.category.nameHi ? post.category.nameHi : post.category.name}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-400 border-t border-b border-slate-800 py-4">
              {post.author && (
                <div className="flex items-center gap-2">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {post.author.name.charAt(0)}
                    </div>
                  )}
                  <span>{post.author.name}</span>
                </div>
              )}
              {post.publishedAt && (
                <span>• {new Date(post.publishedAt).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-10 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Article Markdown Body */}
          <div className="prose prose-invert prose-indigo max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-indigo-400 prose-code:text-indigo-300 prose-pre:bg-slate-900 leading-relaxed">
            {/* Note: In production Next.js, use react-markdown or markdown-to-jsx */}
            <div
              style={{ whiteSpace: 'pre-line' }}
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/### (.*?)\n/g, '<h3 class="text-xl font-bold mt-6 mb-2 text-white">$1</h3>')
                  .replace(/## (.*?)\n/g, '<h2 class="text-2xl font-bold mt-8 mb-3 text-white border-b border-slate-800 pb-2">$1</h2>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>'),
              }}
            />
          </div>
        </div>
      </article>
    </>
  );
}
