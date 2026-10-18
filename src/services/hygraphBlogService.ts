import { hygraphRequest } from '../lib/hygraph';
import {
  Blog,
  BlogCategory,
  ArticleLanguage,
  LinkedTranslation,
  HygraphAuthor,
} from '../types/database';

interface HygraphPostNode {
  id: string;
  title: string;
  slug: string;
  language: ArticleLanguage;
  translationGroupId: string;
  content: string;
  excerpt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  featuredImage?: string | null;
  featuredImageAlt?: string | null;
  isFeatured: boolean;
  legacyId?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  stage: string;
  documentInStages: Array<{ stage: string }>;
  author?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    nameHi?: string | null;
    slug: string;
    sortOrder?: number | null;
    isActive?: boolean | null;
  } | null;
}

interface HygraphCategoryNode {
  id: string;
  name: string;
  nameHi?: string | null;
  slug: string;
  sortOrder?: number | null;
  isActive?: boolean | null;
  createdAt?: string;
}

function mapHygraphPostToBlog(
  node: HygraphPostNode,
  allNodes: HygraphPostNode[] = []
): Blog {
  const isPublished = node.documentInStages.some((s) => s.stage === 'PUBLISHED');

  // Find linked translation in the same translation group
  let linkedTranslation: LinkedTranslation | null = null;
  const counterpart = allNodes.find(
    (n) =>
      n.translationGroupId === node.translationGroupId &&
      n.id !== node.id &&
      n.language !== node.language
  );

  if (counterpart) {
    linkedTranslation = {
      id: counterpart.id,
      title: counterpart.title,
      slug: counterpart.slug,
      language: counterpart.language,
      is_published: counterpart.documentInStages.some((s) => s.stage === 'PUBLISHED'),
      stage: counterpart.stage,
    };
  }

  const categoryObj: BlogCategory | undefined = node.category
    ? {
        id: node.category.id,
        title: node.category.name,
        hindi_title: node.category.nameHi || node.category.name,
        slug: node.category.slug,
        is_active: node.category.isActive ?? true,
        sort_order: node.category.sortOrder ?? 0,
        created_at: node.createdAt,
      }
    : undefined;

  return {
    id: node.id,
    category_id: node.category?.id || '',
    title: node.title,
    slug: node.slug,
    language: node.language,
    translation_group_id: node.translationGroupId,
    content: node.content,
    excerpt: node.excerpt || undefined,
    meta_title: node.metaTitle || undefined,
    meta_description: node.metaDescription || undefined,
    featured_image: node.featuredImage || undefined,
    featured_image_alt: node.featuredImageAlt || undefined,
    author: node.author?.name || 'CCC Prep Team',
    author_id: node.author?.id,
    is_featured: node.isFeatured ?? false,
    is_published: isPublished,
    published_at: isPublished ? (node.publishedAt || node.updatedAt) : undefined,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    legacy_id: node.legacyId || undefined,
    linked_translation: linkedTranslation,

    // Backward-compatible fields for legacy UI components
    title_en: node.language === 'EN' ? node.title : (counterpart?.title || node.title),
    title_hi: node.language === 'HI' ? node.title : (counterpart?.title || node.title),
    summary_en: node.language === 'EN' ? (node.excerpt || '') : (counterpart?.excerpt || ''),
    summary_hi: node.language === 'HI' ? (node.excerpt || '') : (counterpart?.excerpt || ''),
    content_en: node.language === 'EN' ? node.content : (counterpart?.content || node.content),
    content_hi: node.language === 'HI' ? node.content : (counterpart?.content || node.content),

    category: categoryObj,
  };
}

export const hygraphBlogService = {
  // Categories
  async getCategories(): Promise<BlogCategory[]> {
    const query = `
      query GetCategories {
        categories(orderBy: sortOrder_ASC) {
          id
          name
          nameHi
          slug
          sortOrder
          isActive
          createdAt
        }
      }
    `;
    const res = await hygraphRequest<{ categories: HygraphCategoryNode[] }>(query);
    return (res.categories || []).map((c) => ({
      id: c.id,
      title: c.name,
      hindi_title: c.nameHi || c.name,
      slug: c.slug,
      is_active: c.isActive ?? true,
      sort_order: c.sortOrder ?? 0,
      created_at: c.createdAt || new Date().toISOString(),
    }));
  },

  async createCategory(payload: {
    title: string;
    hindi_title?: string;
    slug?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<BlogCategory> {
    const slug =
      payload.slug ||
      payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const mutation = `
      mutation CreateCategory($data: CategoryCreateInput!) {
        createCategory(data: $data) {
          id
          name
          nameHi
          slug
          sortOrder
          isActive
          createdAt
        }
      }
    `;
    const res = await hygraphRequest<{ createCategory: HygraphCategoryNode }>(mutation, {
      data: {
        name: payload.title,
        nameHi: payload.hindi_title || payload.title,
        slug,
        sortOrder: payload.sort_order ?? 0,
        isActive: payload.is_active ?? true,
      },
    });

    // Automatically publish the created category
    try {
      await hygraphRequest(
        `mutation PublishCategory($id: ID!) {
          publishCategory(where: { id: $id }, to: PUBLISHED) { id }
        }`,
        { id: res.createCategory.id }
      );
    } catch (e) {
      console.warn('Category created in draft, auto-publish warning:', e);
    }

    return {
      id: res.createCategory.id,
      title: res.createCategory.name,
      hindi_title: res.createCategory.nameHi || res.createCategory.name,
      slug: res.createCategory.slug,
      is_active: res.createCategory.isActive ?? true,
      sort_order: res.createCategory.sortOrder ?? 0,
      created_at: res.createCategory.createdAt || new Date().toISOString(),
    };
  },

  async updateCategory(
    id: string,
    updates: Partial<BlogCategory>
  ): Promise<BlogCategory> {
    const data: Record<string, any> = {};
    if (updates.title !== undefined) data.name = updates.title;
    if (updates.hindi_title !== undefined) data.nameHi = updates.hindi_title;
    if (updates.slug !== undefined) data.slug = updates.slug;
    if (updates.sort_order !== undefined) data.sortOrder = updates.sort_order;
    if (updates.is_active !== undefined) data.isActive = updates.is_active;

    const mutation = `
      mutation UpdateCategory($id: ID!, $data: CategoryUpdateInput!) {
        updateCategory(where: { id: $id }, data: $data) {
          id
          name
          nameHi
          slug
          sortOrder
          isActive
          createdAt
        }
      }
    `;
    const res = await hygraphRequest<{ updateCategory: HygraphCategoryNode }>(mutation, {
      id,
      data,
    });

    try {
      await hygraphRequest(
        `mutation PublishCategory($id: ID!) {
          publishCategory(where: { id: $id }, to: PUBLISHED) { id }
        }`,
        { id }
      );
    } catch (e) {
      console.warn('Category updated in draft, auto-publish warning:', e);
    }

    return {
      id: res.updateCategory.id,
      title: res.updateCategory.name,
      hindi_title: res.updateCategory.nameHi || res.updateCategory.name,
      slug: res.updateCategory.slug,
      is_active: res.updateCategory.isActive ?? true,
      sort_order: res.updateCategory.sortOrder ?? 0,
      created_at: res.updateCategory.createdAt || new Date().toISOString(),
    };
  },

  async deleteCategory(id: string): Promise<void> {
    const mutation = `
      mutation DeleteCategory($id: ID!) {
        deleteCategory(where: { id: $id }) {
          id
        }
      }
    `;
    await hygraphRequest(mutation, { id });
  },

  // Authors
  async getAuthors(): Promise<HygraphAuthor[]> {
    const query = `
      query GetAuthors {
        authors(orderBy: name_ASC) {
          id
          name
          email
          bio
          avatarUrl
          role
        }
      }
    `;
    const res = await hygraphRequest<{ authors: HygraphAuthor[] }>(query);
    return res.authors || [];
  },

  // Blogs / Posts
  async getBlogs(): Promise<Blog[]> {
    const query = `
      query GetAllPosts {
        posts(stage: DRAFT, orderBy: createdAt_DESC) {
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
          legacyId
          createdAt
          updatedAt
          publishedAt
          stage
          documentInStages {
            stage
          }
          author {
            id
            name
            avatarUrl
            role
          }
          category {
            id
            name
            nameHi
            slug
            sortOrder
            isActive
          }
        }
      }
    `;
    const res = await hygraphRequest<{ posts: HygraphPostNode[] }>(query);
    const nodes = res.posts || [];
    return nodes.map((node) => mapHygraphPostToBlog(node, nodes));
  },

  async getBlogById(id: string): Promise<Blog | null> {
    const allBlogs = await this.getBlogs();
    return allBlogs.find((b) => b.id === id) || null;
  },

  async createBlog(payload: {
    title: string;
    slug: string;
    language: ArticleLanguage;
    translation_group_id?: string;
    content: string;
    excerpt?: string;
    meta_title?: string;
    meta_description?: string;
    featured_image?: string;
    featured_image_alt?: string;
    author_id?: string;
    category_id?: string;
    is_featured?: boolean;
    is_published?: boolean;
    // Backward-compatible fallback params
    title_en?: string;
    title_hi?: string;
    content_en?: string;
    content_hi?: string;
    summary_en?: string;
    summary_hi?: string;
  }): Promise<Blog> {
    const lang = payload.language || 'EN';
    const title = payload.title || (lang === 'EN' ? payload.title_en : payload.title_hi) || '';
    const content = payload.content || (lang === 'EN' ? payload.content_en : payload.content_hi) || '';
    const excerpt = payload.excerpt || (lang === 'EN' ? payload.summary_en : payload.summary_hi) || '';
    const translationGroupId =
      payload.translation_group_id ||
      `tg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const createData: Record<string, any> = {
      title: title.trim(),
      slug: payload.slug.trim().toLowerCase(),
      language: lang,
      translationGroupId,
      content,
      excerpt: excerpt.trim() || undefined,
      metaTitle: payload.meta_title?.trim() || undefined,
      metaDescription: payload.meta_description?.trim() || undefined,
      featuredImage: payload.featured_image?.trim() || undefined,
      featuredImageAlt: payload.featured_image_alt?.trim() || undefined,
      isFeatured: payload.is_featured ?? false,
    };

    if (payload.category_id) {
      createData.category = { connect: { id: payload.category_id } };
    }

    if (payload.author_id) {
      createData.author = { connect: { id: payload.author_id } };
    } else {
      // Connect first available author or create default
      const authors = await this.getAuthors();
      if (authors.length > 0) {
        createData.author = { connect: { id: authors[0].id } };
      }
    }

    const mutation = `
      mutation CreatePost($data: PostCreateInput!) {
        createPost(data: $data) {
          id
        }
      }
    `;

    const res = await hygraphRequest<{ createPost: { id: string } }>(mutation, {
      data: createData,
    });
    const newId = res.createPost.id;

    if (payload.is_published) {
      try {
        await hygraphRequest(
          `mutation PublishPost($id: ID!) {
            publishPost(where: { id: $id }, to: PUBLISHED) { id }
          }`,
          { id: newId }
        );
      } catch (err) {
        console.warn('Failed to publish post immediately after creation:', err);
      }
    }

    const fetched = await this.getBlogById(newId);
    if (!fetched) {
      throw new Error('Created post could not be retrieved from Hygraph');
    }
    return fetched;
  },

  async updateBlog(id: string, updates: Partial<Blog>): Promise<Blog> {
    const updateData: Record<string, any> = {};

    if (updates.title !== undefined) updateData.title = updates.title.trim();
    if (updates.slug !== undefined) updateData.slug = updates.slug.trim().toLowerCase();
    if (updates.language !== undefined) updateData.language = updates.language;
    if (updates.translation_group_id !== undefined)
      updateData.translationGroupId = updates.translation_group_id;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt?.trim() || null;
    if (updates.meta_title !== undefined) updateData.metaTitle = updates.meta_title?.trim() || null;
    if (updates.meta_description !== undefined)
      updateData.metaDescription = updates.meta_description?.trim() || null;
    if (updates.featured_image !== undefined)
      updateData.featuredImage = updates.featured_image?.trim() || null;
    if (updates.featured_image_alt !== undefined)
      updateData.featuredImageAlt = updates.featured_image_alt?.trim() || null;
    if (updates.is_featured !== undefined) updateData.isFeatured = updates.is_featured;

    if (updates.category_id) {
      updateData.category = { connect: { id: updates.category_id } };
    }

    if (updates.author_id) {
      updateData.author = { connect: { id: updates.author_id } };
    }

    if (Object.keys(updateData).length > 0) {
      const mutation = `
        mutation UpdatePost($id: ID!, $data: PostUpdateInput!) {
          updatePost(where: { id: $id }, data: $data) {
            id
          }
        }
      `;
      await hygraphRequest(mutation, { id, data: updateData });
    }

    // Handle publishing state change
    if (updates.is_published !== undefined) {
      if (updates.is_published) {
        await hygraphRequest(
          `mutation PublishPost($id: ID!) {
            publishPost(where: { id: $id }, to: PUBLISHED) { id }
          }`,
          { id }
        );
      } else {
        await hygraphRequest(
          `mutation UnpublishPost($id: ID!) {
            unpublishPost(where: { id: $id }, from: PUBLISHED) { id }
          }`,
          { id }
        );
      }
    } else {
      // If the post is currently published and content was updated, re-publish to sync
      const current = await this.getBlogById(id);
      if (current?.is_published) {
        try {
          await hygraphRequest(
            `mutation PublishPost($id: ID!) {
              publishPost(where: { id: $id }, to: PUBLISHED) { id }
            }`,
            { id }
          );
        } catch (e) {
          console.warn('Re-publish sync warning:', e);
        }
      }
    }

    const refreshed = await this.getBlogById(id);
    if (!refreshed) {
      throw new Error(`Updated post with id ${id} could not be retrieved`);
    }
    return refreshed;
  },

  async deleteBlog(id: string): Promise<void> {
    const mutation = `
      mutation DeletePost($id: ID!) {
        deletePost(where: { id: $id }) {
          id
        }
      }
    `;
    await hygraphRequest(mutation, { id });
  },

  // Translation Pairing & Linking
  async linkTranslations(postAId: string, postBId: string): Promise<void> {
    if (postAId === postBId) {
      throw new Error('An article cannot be linked to itself as a translation.');
    }

    const [postA, postB] = await Promise.all([
      this.getBlogById(postAId),
      this.getBlogById(postBId),
    ]);

    if (!postA || !postB) {
      throw new Error('One or both articles could not be found.');
    }

    if (postA.language === postB.language) {
      throw new Error(
        `Cannot link articles with the same language (${postA.language}). One must be English and the other Hindi.`
      );
    }

    // Determine target shared translation group ID
    const sharedGroupId =
      postA.translation_group_id ||
      postB.translation_group_id ||
      `tg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Update both posts with the shared translation group ID
    await Promise.all([
      hygraphRequest(
        `mutation SetTranslationGroupA($id: ID!, $gid: String!) {
          updatePost(where: { id: $id }, data: { translationGroupId: $gid }) { id }
        }`,
        { id: postAId, gid: sharedGroupId }
      ),
      hygraphRequest(
        `mutation SetTranslationGroupB($id: ID!, $gid: String!) {
          updatePost(where: { id: $id }, data: { translationGroupId: $gid }) { id }
        }`,
        { id: postBId, gid: sharedGroupId }
      ),
    ]);

    // If either was published, re-publish to sync the new relation
    if (postA.is_published) {
      try {
        await hygraphRequest(
          `mutation PubA($id: ID!) { publishPost(where: { id: $id }, to: PUBLISHED) { id } }`,
          { id: postAId }
        );
      } catch (e) {
        console.warn('Re-publish A warning:', e);
      }
    }

    if (postB.is_published) {
      try {
        await hygraphRequest(
          `mutation PubB($id: ID!) { publishPost(where: { id: $id }, to: PUBLISHED) { id } }`,
          { id: postBId }
        );
      } catch (e) {
        console.warn('Re-publish B warning:', e);
      }
    }
  },

  async unlinkTranslation(postId: string): Promise<void> {
    const post = await this.getBlogById(postId);
    if (!post) throw new Error('Article not found.');

    // Assign a fresh independent translationGroupId
    const freshGroupId = `tg_unlinked_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await hygraphRequest(
      `mutation UnlinkTranslation($id: ID!, $gid: String!) {
        updatePost(where: { id: $id }, data: { translationGroupId: $gid }) { id }
      }`,
      { id: postId, gid: freshGroupId }
    );

    if (post.is_published) {
      try {
        await hygraphRequest(
          `mutation Pub($id: ID!) { publishPost(where: { id: $id }, to: PUBLISHED) { id } }`,
          { id: postId }
        );
      } catch (e) {
        console.warn('Re-publish unlinked post warning:', e);
      }
    }
  },

  async createTranslationDraft(sourcePostId: string): Promise<Blog> {
    const source = await this.getBlogById(sourcePostId);
    if (!source) throw new Error('Source article not found.');

    if (source.linked_translation) {
      throw new Error(
        `This article already has a linked ${source.linked_translation.language === 'EN' ? 'English' : 'Hindi'} translation: "${source.linked_translation.title}"`
      );
    }

    const targetLang: ArticleLanguage = source.language === 'EN' ? 'HI' : 'EN';
    const targetSlugSuffix = targetLang === 'HI' ? '-hi' : '-en';
    const targetSlug = `${source.slug.replace(/-(hi|en)$/, '')}${targetSlugSuffix}`;

    const newDraft = await this.createBlog({
      title: `${source.title} (${targetLang === 'HI' ? 'हिंदी अनुवाद' : 'English Translation'})`,
      slug: targetSlug,
      language: targetLang,
      translation_group_id: source.translation_group_id,
      content:
        targetLang === 'HI'
          ? `# ${source.title}\n\nयहाँ हिंदी में लेख सामग्री लिखें...`
          : `# ${source.title}\n\nWrite article content in English here...`,
      excerpt: '',
      meta_title: `${source.meta_title || source.title} (${targetLang})`,
      meta_description: source.meta_description || '',
      featured_image: source.featured_image,
      featured_image_alt: source.featured_image_alt,
      category_id: source.category_id,
      author_id: source.author_id,
      is_featured: false,
      is_published: false, // Must always default to draft!
    });

    return newDraft;
  },

  async getEligibleTranslations(
    targetLanguage: ArticleLanguage,
    excludeId?: string
  ): Promise<Blog[]> {
    const allBlogs = await this.getBlogs();
    return allBlogs.filter(
      (b) => b.language === targetLanguage && b.id !== excludeId
    );
  },
};
