import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useFindById } from '@/hooks/use-find-by-id';
import { X } from 'lucide-react';
import FileUpload from '@/components/shared/FileUpload';
import SearchableSelect, { optionsFromStrings } from '@/components/shared/SearchableSelect';
import { useAdminHeader, AdminHeaderButton } from '@/contexts/AdminHeaderContext';
import { adminPaths } from '@/lib/admin-paths';
import type { Document } from '@/lib/api-types';
import { getErrorMessage } from '@/lib/utils';

const emptyForm = () => ({
  title: '',
  category: 'Juknis',
  version: '1.0',
  file_url: '',
  is_public: false,
});

const DokumenFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState(emptyForm());

  const { data: item, isLoading } = useFindById<Document>('/documents', id, { enabled: isEdit });

  useEffect(() => {
    if (!isEdit || isLoading) return;
    if (!item) {
      toast({ title: 'Dokumen tidak ditemukan', variant: 'destructive' });
      navigate(adminPaths.dokumen.list);
      return;
    }
    setForm({
      title: item.title,
      category: item.category,
      version: item.version,
      file_url: item.file_url || '',
      is_public: item.is_public,
    });
  }, [item, isEdit, isLoading, navigate, toast]);

  const saveMutation = useApiMutation({
    invalidate: ['/documents'],
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isEdit) {
        await api.patch(`/documents/${id}`, payload);
      } else {
        await api.post('/documents', payload);
      }
    },
    onSuccess: () => {
      toast({ title: 'Berhasil' });
      navigate(adminPaths.dokumen.list);
    },
    onError: (error: unknown) => {
      toast({ title: 'Gagal', description: getErrorMessage(error), variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, published_at: form.is_public ? new Date().toISOString() : null });
  };

  useAdminHeader({
    cta: (
      <AdminHeaderButton onClick={() => navigate(adminPaths.dokumen.list)}>
        <X className="w-4 h-4" /> Batal
      </AdminHeaderButton>
    ),
  });

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="card-elevated p-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Judul</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <SearchableSelect
            value={form.category}
            onValueChange={(category) => setForm({ ...form, category })}
            options={optionsFromStrings(['Juknis', 'SOP', 'Surat Edaran', 'Template', 'Laporan Ringkas'])}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Versi</label>
          <input
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
          />
        </div>
        <div>
          <FileUpload
            value={form.file_url}
            onChange={(url) => setForm({ ...form, file_url: url })}
            folder="documents"
            label="File Dokumen"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            id="doc-public"
            className="rounded"
          />
          <label htmlFor="doc-public" className="text-sm">
            Tampilkan ke publik
          </label>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
          >
            {isEdit ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DokumenFormPage;
