import { isRichTextEmpty } from '@/components/shared/RichTextEditor';

export function splitExcerpt(content: string): { excerpt: string; body: string } {
  const match = content.match(/^<p>([\s\S]*?)<\/p>\s*/i);
  if (match) {
    const excerpt = match[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (excerpt.length <= 300) {
      return { excerpt, body: content.slice(match[0].length) };
    }
  }
  return { excerpt: '', body: content };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function mergeExcerpt(excerpt: string, body: string): string {
  const e = excerpt.trim();
  const b = body.trim();
  if (!e) return b;
  const excerptHtml = `<p>${escapeHtml(e)}</p>`;
  if (!b || isRichTextEmpty(b)) return excerptHtml;
  return `${excerptHtml}${b}`;
}

export function toDateInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
