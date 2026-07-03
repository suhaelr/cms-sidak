import { useRef, useState, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { Loader2, Upload, X } from 'lucide-react';
import WilayahSelect from '@/components/shared/WilayahSelect';
import SearchableSelect from '@/components/shared/SearchableSelect';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Switch } from '@/components/ui/switch';
import type { NewsCategory } from '@/lib/api-types';

export interface BeritaFormValues {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: string;
  cover_image: string;
  cover_image_source: string;
  region_id: string;
  status: string;
  published_at: string;
  is_highlight: boolean;
  is_breaking: boolean;
  tags: string[];
}

export const emptyBeritaForm = (): BeritaFormValues => ({
  title: '',
  slug: '',
  excerpt: '',
  category: 'sidak',
  content: '',
  cover_image: '',
  cover_image_source: '',
  region_id: '',
  status: 'draft',
  published_at: '',
  is_highlight: false,
  is_breaking: false,
  tags: [],
});

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30';

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-elevated p-5 sm:p-6">
      <h3 className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase mb-4">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-1.5">
      {children}
    </label>
  );
}

function DisplayOption({
  title,
  description,
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={ariaLabel} />
    </div>
  );
}

function MediaPreview({ url }: { url: string }) {
  if (!url) {
    return (
      <div className="aspect-video rounded-lg border border-dashed border-muted-foreground/25 bg-muted/40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Pratinjau media akan muncul di sini</p>
      </div>
    );
  }

  const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  return (
    <div className="aspect-video rounded-lg border overflow-hidden bg-muted">
      {isVideo ? (
        <video src={url} controls className="w-full h-full object-cover" />
      ) : (
        <img src={url} alt="Pratinjau" className="w-full h-full object-cover" />
      )}
    </div>
  );
}

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#/, '').replace(/\s+/g, '-').toLowerCase();
}

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag || tags.includes(tag)) return;
    onChange([...tags, tag]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      value.split(',').forEach((part) => addTag(part));
      setInput('');
      return;
    }
    setInput(value);
  };

  return (
    <div>
      <FieldLabel htmlFor="berita-tags">Tag</FieldLabel>
      <div
        className={`${inputClass} flex flex-wrap gap-1.5 items-center py-2 min-h-[42px] cursor-text`}
        onClick={() => document.getElementById('berita-tags')?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-muted text-foreground rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(tags.filter((t) => t !== tag));
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Hapus tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          id="berita-tags"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) {
              addTag(input);
              setInput('');
            }
          }}
          placeholder={tags.length ? '' : 'sidak, jakarta, gizi...'}
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Tekan{' '}
        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted border border-border rounded">
          Enter
        </kbd>{' '}
        atau koma untuk menambah tag.
      </p>
    </div>
  );
}

interface BeritaFormProps {
  form: BeritaFormValues;
  onChange: (form: BeritaFormValues) => void;
  editing?: { id: string; created_at: string } | null;
  articleCode?: string | null;
  formKey?: string;
  onDelete?: () => void;
}

const BeritaForm = ({ form, onChange, editing, articleCode, formKey, onDelete }: BeritaFormProps) => {
  const [mediaTab, setMediaTab] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: categories = [] } = useApiQuery<NewsCategory[]>('/news-categories');

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.upload(file, 'news'),
  });

  const set = (patch: Partial<BeritaFormValues>) => onChange({ ...form, ...patch });

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadMutation.mutateAsync(file);
      set({ cover_image: url });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const createdLabel = editing
    ? new Date(editing.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
      <div className="space-y-5">
        <FormCard title="Konten Artikel">
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="berita-title">Judul Artikel</FieldLabel>
              <input
                id="berita-title"
                value={form.title}
                onChange={(e) =>
                  set({ title: e.target.value, slug: generateSlug(e.target.value) })
                }
                required
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="berita-excerpt">Ringkasan / Excerpt</FieldLabel>
              <div className="relative">
                <textarea
                  id="berita-excerpt"
                  value={form.excerpt}
                  onChange={(e) => set({ excerpt: e.target.value.slice(0, 300) })}
                  rows={3}
                  maxLength={300}
                  placeholder="Ringkasan singkat untuk kartu berita dan SEO..."
                  className={`${inputClass} resize-none pb-7`}
                />
                <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {form.excerpt.length}/300
                </span>
              </div>
            </div>

            <div>
              <FieldLabel>Isi Artikel</FieldLabel>
              <RichTextEditor
                key={formKey ?? 'new'}
                value={form.content}
                onChange={(content) => set({ content })}
                placeholder="Tulis isi artikel..."
              />
            </div>
          </div>
        </FormCard>

        <FormCard title="Media Utama">
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-4">
            {(['url', 'upload'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMediaTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mediaTab === tab
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'url' ? 'URL / CDN' : 'Upload File'}
              </button>
            ))}
          </div>

          {mediaTab === 'url' ? (
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="berita-cover-url">URL Gambar atau Video</FieldLabel>
                <input
                  id="berita-cover-url"
                  value={form.cover_image}
                  onChange={(e) => set({ cover_image: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Format: JPG, PNG, WebP, MP4, WebM. Rasio disarankan 16:9.
                </p>
              </div>
              <MediaPreview url={form.cover_image} />
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {uploading ? (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengupload...
                  </span>
                ) : (
                  <span className="inline-flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="w-5 h-5" />
                    Klik untuk memilih file
                  </span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />
              <MediaPreview url={form.cover_image} />
            </div>
          )}
          
          <div className="mt-4 border-t border-border pt-4">
            <FieldLabel htmlFor="berita-cover-source">Sumber Gambar (Attribution)</FieldLabel>
            <input
              id="berita-cover-source"
              value={form.cover_image_source}
              onChange={(e) => set({ cover_image_source: e.target.value })}
              placeholder="Contoh: Humas BGN, Antara Foto"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sumber gambar/attribution akan ditampilkan di bawah gambar cover di halaman detail berita.
            </p>
          </div>
        </FormCard>

        <FormCard title="Informasi Lokasi (Sidak)">
          <WilayahSelect
            key={formKey ?? 'new'}
            regionId={form.region_id || null}
            onRegionIdChange={(id) => set({ region_id: id || '' })}
            className="gap-4"
          />
        </FormCard>
      </div>

      <div className="space-y-5">
        <FormCard title="Penerbitan">
          <div className="space-y-4">
            <div>
              <FieldLabel>Status</FieldLabel>
              <SearchableSelect
                value={form.status}
                onValueChange={(status) => set({ status })}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Terbit' },
                  { value: 'archived', label: 'Arsip' },
                ]}
              />
            </div>
            <div>
              <FieldLabel htmlFor="berita-published">Tanggal Terbit</FieldLabel>
              <input
                id="berita-published"
                type="date"
                value={form.published_at}
                onChange={(e) => set({ published_at: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </FormCard>

        <FormCard title="Kategori & Jenis">
          <div className="space-y-4">
            <div>
              <FieldLabel>Kategori</FieldLabel>
              <SearchableSelect
                value={form.category}
                onValueChange={(category) => set({ category })}
                options={categories.map((c) => ({
                  value: c.slug,
                  label: `${c.short_label} — ${c.full_label}`,
                }))}
              />
            </div>
            <TagInput tags={form.tags} onChange={(tags) => set({ tags })} />
          </div>
        </FormCard>

        <FormCard title="Opsi Tampilan">
          <div className="space-y-4">
            <DisplayOption
              title="Breaking News"
              description="Tampil di ticker merah"
              checked={form.is_breaking}
              onCheckedChange={(is_breaking) => set({ is_breaking })}
              ariaLabel="Breaking News"
            />
            <div className="border-t border-border pt-4">
              <DisplayOption
                title="Berita Pilihan"
                description="Tampil di sidebar beranda"
                checked={form.is_highlight}
                onCheckedChange={(is_highlight) => set({ is_highlight })}
                ariaLabel="Berita Pilihan"
              />
            </div>
          </div>
        </FormCard>

        {editing && (
          <section className="card-elevated p-5 sm:p-6">
            <div className="space-y-1 text-sm text-muted-foreground mb-4">
              {articleCode && (
                <p>
                  Kode: <span className="text-foreground font-medium">{articleCode}</span>
                </p>
              )}
              <p>
                Tayangan: <span className="text-foreground font-medium">0</span>
              </p>
              {createdLabel && (
                <p>
                  Dibuat: <span className="text-foreground font-medium">{createdLabel}</span>
                </p>
              )}
            </div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors"
              >
                Hapus Artikel
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default BeritaForm;
