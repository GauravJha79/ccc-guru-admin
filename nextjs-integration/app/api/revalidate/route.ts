import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Hygraph Webhook On-Demand Cache Revalidation Route
 *
 * Configured in Hygraph Dashboard -> Settings -> Webhooks.
 * Triggered on Post: PUBLISH, UNPUBLISH, UPDATE, DELETE.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-hygraph-secret') || request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.HYGRAPH_WEBHOOK_SECRET;

    // Verify secret token if configured
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid webhook secret' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, data } = body;

    console.log(`[Hygraph Webhook] Received ${operation} for model ${data?.__typename || 'Post'}:`, data?.id);

    // 1. Invalidate global blog lists tag
    revalidateTag('blogs');

    // 2. Invalidate specific post tags and paths if slug is provided
    if (data?.slug) {
      revalidateTag(`post-${data.slug}`);

      if (data?.language === 'HI') {
        revalidatePath(`/hi/blogs/${data.slug}`);
      } else {
        revalidatePath(`/en/blogs/${data.slug}`);
      }
    }

    // 3. Invalidate translation group tag if present
    if (data?.translationGroupId) {
      revalidateTag(`tg-${data.translationGroupId}`);
    }

    // 4. Invalidate blog directory pages
    revalidatePath('/en/blogs');
    revalidatePath('/hi/blogs');

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      operation,
      slug: data?.slug || null,
    });
  } catch (err: any) {
    console.error('[Hygraph Webhook] Revalidation failed:', err);
    return NextResponse.json(
      { message: 'Error revalidating', error: err.message },
      { status: 500 }
    );
  }
}
