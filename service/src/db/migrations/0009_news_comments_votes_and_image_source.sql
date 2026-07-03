ALTER TABLE "news_comments" ADD COLUMN "likes" integer DEFAULT 0 NOT NULL;
ALTER TABLE "news_comments" ADD COLUMN "dislikes" integer DEFAULT 0 NOT NULL;
ALTER TABLE "news" ADD COLUMN "cover_image_source" text;
