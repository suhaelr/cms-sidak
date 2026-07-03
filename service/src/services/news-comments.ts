import { eq, and, desc, sql } from 'drizzle-orm';
import { db, schema } from '../db';

export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export async function getApprovedComments(articleSlug: string) {
  const rows = await db
    .select({
      id: schema.newsComments.id,
      articleSlug: schema.newsComments.articleSlug,
      userId: schema.newsComments.userId,
      content: schema.newsComments.content,
      status: schema.newsComments.status,
      isAnonymous: schema.newsComments.isAnonymous,
      likes: schema.newsComments.likes,
      dislikes: schema.newsComments.dislikes,
      createdAt: schema.newsComments.createdAt,
      updatedAt: schema.newsComments.updatedAt,
      user: {
        id: schema.users.id,
        email: schema.users.email,
        fullName: schema.users.fullName,
      },
    })
    .from(schema.newsComments)
    .leftJoin(schema.users, eq(schema.newsComments.userId, schema.users.id))
    .where(
      and(
        eq(schema.newsComments.articleSlug, articleSlug),
        eq(schema.newsComments.status, 'approved')
      )
    )
    .orderBy(desc(schema.newsComments.createdAt));

  return rows.map((r) => {
    if (r.isAnonymous) {
      return {
        ...r,
        user: {
          id: '',
          email: '',
          fullName: 'Anonim',
        },
      };
    }
    return r;
  });
}

export async function createComment(articleSlug: string, userId: string, content: string, isAnonymous = false) {
  const sanitized = sanitizeInput(content);
  const [row] = await db
    .insert(schema.newsComments)
    .values({
      articleSlug,
      userId,
      content: sanitized,
      status: 'pending',
      isAnonymous,
    })
    .returning();

  return row;
}

export async function getCommentsByStatus(status?: string) {
  const query = db
    .select({
      id: schema.newsComments.id,
      articleSlug: schema.newsComments.articleSlug,
      userId: schema.newsComments.userId,
      content: schema.newsComments.content,
      status: schema.newsComments.status,
      isAnonymous: schema.newsComments.isAnonymous,
      likes: schema.newsComments.likes,
      dislikes: schema.newsComments.dislikes,
      createdAt: schema.newsComments.createdAt,
      updatedAt: schema.newsComments.updatedAt,
      user: {
        id: schema.users.id,
        email: schema.users.email,
        fullName: schema.users.fullName,
      },
    })
    .from(schema.newsComments)
    .leftJoin(schema.users, eq(schema.newsComments.userId, schema.users.id));

  let rows;
  if (status) {
    rows = await query
      .where(eq(schema.newsComments.status, status))
      .orderBy(desc(schema.newsComments.createdAt));
  } else {
    rows = await query.orderBy(desc(schema.newsComments.createdAt));
  }

  return rows;
}

export async function updateCommentStatus(commentId: string, status: 'approved' | 'rejected') {
  const [row] = await db
    .update(schema.newsComments)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.newsComments.id, commentId))
    .returning();

  return row;
}

export async function deleteComment(commentId: string) {
  const [row] = await db
    .delete(schema.newsComments)
    .where(eq(schema.newsComments.id, commentId))
    .returning();

  return row;
}

export async function voteComment(commentId: string, voteType: 'like' | 'dislike' | 'unlike' | 'undislike') {
  let likesDiff = 0;
  let dislikesDiff = 0;

  if (voteType === 'like') {
    likesDiff = 1;
  } else if (voteType === 'unlike') {
    likesDiff = -1;
  } else if (voteType === 'dislike') {
    dislikesDiff = 1;
  } else if (voteType === 'undislike') {
    dislikesDiff = -1;
  }

  const [row] = await db
    .update(schema.newsComments)
    .set({
      likes: sql`GREATEST(0, ${schema.newsComments.likes} + ${likesDiff})`,
      dislikes: sql`GREATEST(0, ${schema.newsComments.dislikes} + ${dislikesDiff})`,
      updatedAt: new Date()
    })
    .where(eq(schema.newsComments.id, commentId))
    .returning();

  return row;
}
