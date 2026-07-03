import { eq, sql } from 'drizzle-orm';
import { db, schema } from '../db';

export interface ReactionCounts {
  likes: number;
  dislikes: number;
}

export async function getReactions(articleSlug: string): Promise<ReactionCounts> {
  const [row] = await db
    .select({ likes: schema.articleReactions.likes, dislikes: schema.articleReactions.dislikes })
    .from(schema.articleReactions)
    .where(eq(schema.articleReactions.articleSlug, articleSlug))
    .limit(1);

  return row ?? { likes: 0, dislikes: 0 };
}

export async function incrementLike(articleSlug: string): Promise<ReactionCounts> {
  const [row] = await db
    .insert(schema.articleReactions)
    .values({ articleSlug, likes: 1, dislikes: 0 })
    .onConflictDoUpdate({
      target: schema.articleReactions.articleSlug,
      set: {
        likes: sql`${schema.articleReactions.likes} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({
      likes: schema.articleReactions.likes,
      dislikes: schema.articleReactions.dislikes,
    });

  return row;
}

export async function incrementDislike(articleSlug: string): Promise<ReactionCounts> {
  const [row] = await db
    .insert(schema.articleReactions)
    .values({ articleSlug, likes: 0, dislikes: 1 })
    .onConflictDoUpdate({
      target: schema.articleReactions.articleSlug,
      set: {
        dislikes: sql`${schema.articleReactions.dislikes} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({
      likes: schema.articleReactions.likes,
      dislikes: schema.articleReactions.dislikes,
    });

  return row;
}
