import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  date,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';

export const appRoleEnum = pgEnum('app_role', [
  'super_admin',
  'admin_pusat',
  'admin_wilayah',
  'inspektor',
  'verifikator',
]);

export const authProviderEnum = pgEnum('auth_provider', ['local', 'ory']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  fullName: text('full_name').notNull().default(''),
  regionId: text('region_id'),
  oryIdentityId: text('ory_identity_id').unique(),
  authProvider: authProviderEnum('auth_provider').notNull().default('local'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: appRoleEnum('role').notNull(),
  },
  (t) => [unique().on(t.userId, t.role)],
);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const regions = pgTable('regions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  parentId: uuid('parent_id'),
  legacyId: bigint('legacy_id', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sppgKitchens = pgTable('sppg_kitchens', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  address: text('address'),
  regionId: text('region_id'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const findingCategories = pgTable('finding_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sanctionTypes = pgTable('sanction_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  regionId: text('region_id'),
  kitchenId: uuid('kitchen_id').references(() => sppgKitchens.id),
  summary: text('summary'),
  publicationStatus: text('publication_status').notNull().default('draft'),
  showIdentity: boolean('show_identity').notNull().default(false),
  showMedia: boolean('show_media').notNull().default(false),
  createdBy: uuid('created_by').references(() => users.id),
  verifiedBy: uuid('verified_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const inspectionChecklists = pgTable('inspection_checklists', {
  id: uuid('id').primaryKey().defaultRandom(),
  inspectionId: uuid('inspection_id')
    .notNull()
    .references(() => inspections.id, { onDelete: 'cascade' }),
  itemLabel: text('item_label').notNull(),
  valueBool: boolean('value_bool').notNull().default(false),
});

export const findings = pgTable('findings', {
  id: uuid('id').primaryKey().defaultRandom(),
  inspectionId: uuid('inspection_id')
    .notNull()
    .references(() => inspections.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  severity: text('severity').notNull(),
  description: text('description').notNull(),
  recommendation: text('recommendation'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const medias = pgTable('medias', {
  id: uuid('id').primaryKey().defaultRandom(),
  inspectionId: uuid('inspection_id')
    .notNull()
    .references(() => inspections.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  url: text('url').notNull(),
  caption: text('caption'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const followups = pgTable('followups', {
  id: uuid('id').primaryKey().defaultRandom(),
  inspectionId: uuid('inspection_id')
    .notNull()
    .references(() => inspections.id, { onDelete: 'cascade' }),
  findingId: uuid('finding_id').references(() => findings.id, { onDelete: 'set null' }),
  actionType: text('action_type').notNull(),
  deadline: date('deadline'),
  status: text('status').notNull().default('belum'),
  pic: text('pic'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sanctions = pgTable('sanctions', {
  id: uuid('id').primaryKey().defaultRandom(),
  inspectionId: uuid('inspection_id').references(() => inspections.id),
  kitchenId: uuid('kitchen_id').references(() => sppgKitchens.id),
  violationSummary: text('violation_summary').notNull(),
  sanctionType: text('sanction_type').notNull(),
  date: date('date').notNull(),
  status: text('status').notNull().default('aktif'),
  followUpStatus: text('follow_up_status').notNull().default('belum'),
  isPublic: boolean('is_public').notNull().default(false),
  showIdentity: boolean('show_identity').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const newsCategories = pgTable('news_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  fullLabel: text('full_label').notNull(),
  shortLabel: text('short_label').notNull(),
  badgeColor: text('badge_color').notNull().default('muted'),
  isBuiltin: boolean('is_builtin').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  coverImageSource: text('cover_image_source'),
  regionId: text('region_id'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  status: text('status').notNull().default('draft'),
  isHighlight: boolean('is_highlight').notNull().default(false),
  isBreaking: boolean('is_breaking').notNull().default(false),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  version: text('version').notNull().default('1.0'),
  fileUrl: text('file_url'),
  isPublic: boolean('is_public').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const complaints = pgTable('complaints', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNo: text('ticket_no').notNull().unique(),
  name: text('name'),
  contact: text('contact').notNull(),
  regionId: text('region_id'),
  topic: text('topic').notNull(),
  content: text('content').notNull(),
  attachmentUrl: text('attachment_url'),
  status: text('status').notNull().default('new'),
  publicStatusMessage: text('public_status_message'),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id'),
  action: text('action').notNull(),
  changesJson: jsonb('changes_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const heroSlides = pgTable('hero_slides', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title'),
  imageUrl: text('image_url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const articleReactions = pgTable('article_reactions', {
  articleSlug: text('article_slug').primaryKey(),
  likes: integer('likes').notNull().default(0),
  dislikes: integer('dislikes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const newsComments = pgTable('news_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleSlug: text('article_slug').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  likes: integer('likes').notNull().default(0),
  dislikes: integer('dislikes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AppRole = (typeof appRoleEnum.enumValues)[number];
