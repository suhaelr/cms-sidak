import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import BeritaForm, { emptyBeritaForm, type BeritaFormValues } from '@/components/admin/BeritaForm';
import { isRichTextEmpty } from '@/components/shared/RichTextEditor';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { cn, getErrorMessage } from '@/lib/utils';
import { adminPaths } from '@/lib/admin-paths';
import {
  generateSlug,
  mergeExcerpt,
  splitExcerpt,
  toDateInput,
} from '@/lib/berita-admin-utils';
import type { NewsArticle } from '@/lib/api-types';

const BeritaFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState<BeritaFormValues>(emptyBeritaForm());

  const { data: article, isLoading: articleLoading } = useFindById<NewsArticle>('/news', id, {
    enabled: isEdit,
  });
  const { data: items = [] } = useApiQuery<NewsArticle[]>('/news', { enabled: isEdit });

  useEffect(() => {
    if (!isEdit || articleLoading) return;
    if (!article) {
      toast({ title: 'Artikel tidak ditemukan', variant: 'destructive' });
      navigate(adminPaths.berita.list);
      return;
    }
    setEditing(article);
    const { excerpt, body } = splitExcerpt(article.content || '');
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt,
      category: article.category,
      content: body,
      cover_image: article.cover_image || '',
      cover_image_source: article.cover_image_source || '',
      region_id: article.region_id || '',
      status: article.status,
      published_at: toDateInput(article.published_at),
      is_highlight: article.is_highlight ?? false,
      is_breaking: article.is_breaking ?? false,
      tags: article.tags ?? [],
    });
  }, [article, isEdit, articleLoading, navigate, toast]);

  const closeForm = () => navigate(adminPaths.berita.list);

  const saveMutation = useApiMutation({
    invalidate: ['/news'],
    mutationFn: async ({ data, articleId }: { data: Record<string, unknown>; articleId?: string }) => {
      if (articleId) {
        await api.patch(`/news/${articleId}`, data);
      } else {
        await api.post('/news', data);
      }
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables.data.status === 'published' ? 'Artikel diterbitkan' : 'Draft disimpan',
      });
      closeForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const deleteMutation = useApiMutation({
    invalidate: ['/news'],
    mutationFn: async (articleId: string) => {
      await api.delete(`/news/${articleId}`);
    },
    onSuccess: () => {
      toast({ title: 'Artikel dihapus' });
      closeForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const saving = saveMutation.isPending;

  const saveArticle = (status: string) => {
    const body = mergeExcerpt(form.excerpt, form.content);
    if (!form.title.trim() || isRichTextEmpty(body)) {
      toast({ title: 'Judul dan isi artikel wajib diisi', variant: 'destructive' });
      return;
    }

    const data: Record<string, unknown> = {
      title: form.title.trim(),
      slug: form.slug || generateSlug(form.title),
      category: form.category,
      content: body,
      cover_image: form.cover_image || null,
      cover_image_source: form.cover_image_source.trim() || null,
      region_id: form.region_id || null,
      status,
      is_highlight: form.is_highlight,
      is_breaking: form.is_breaking,
      tags: form.tags,
    };

    if (form.published_at) {
      data.published_at = new Date(`${form.published_at}T00:00:00`).toISOString();
    }

    saveMutation.mutate({ data, articleId: isEdit && editing ? editing.id : undefined });
  };

  const handleDelete = () => {
    if (!editing || !confirm('Hapus artikel ini?')) return;
    deleteMutation.mutate(editing.id);
  };

  const articleCode = editing
    ? `BGN-${new Date(editing.created_at).getFullYear()}-${String(
        items.findIndex((i) => i.id === editing.id) + 1,
      ).padStart(3, '0')}`
    : null;

  useAdminHeader(
    {
      cta: (
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={closeForm}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => saveArticle('draft')}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-secondary/40 text-green-800 hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={() => saveArticle('published')}
            disabled={saving}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50',
            )}
          >
            Terbitkan
          </button>
        </div>
      ),
    },
    [saving, form],
  );

  if (isEdit && articleLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveArticle(form.status);
      }}
      className="-m-4 sm:-m-6 lg:-mx-8 p-4 sm:p-6 lg:px-8 bg-muted/30 min-h-[calc(100vh-4rem)]"
    >
      <BeritaForm
        form={form}
        onChange={setForm}
        editing={editing}
        articleCode={articleCode}
        formKey={editing?.id ?? 'new'}
        onDelete={editing ? handleDelete : undefined}
      />
    </form>
  );
};

export default BeritaFormPage;
