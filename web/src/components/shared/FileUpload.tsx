import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Upload, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  folder?: string;
  label?: string;
  placeholder?: string;
}

const FileUpload = ({ value, onChange, accept = 'image/*', folder = 'general', label, placeholder = 'Upload atau paste URL' }: FileUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.upload(file, folder),
    onSuccess: ({ url }) => onChange(url),
    onError: (err) => console.error('Upload error:', err),
  });

  const uploadFile = (file: File) => {
    uploadMutation.mutate(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const uploading = uploadMutation.isPending;
  const isImage = value && (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || accept === 'image/*');

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium">{label}</label>}
      
      {value && isImage && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange('')} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {value && !isImage && (
        <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded-lg">
          <span className="truncate flex-1">{value.split('/').pop()}</span>
          <button type="button" onClick={() => onChange('')} className="text-destructive"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {!value && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Mengupload...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
              <Upload className="w-5 h-5" />
              <span>Klik atau drag file ke sini</span>
            </div>
          )}
          <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        </div>
      )}

      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-background border rounded-lg"
      />
    </div>
  );
};

export default FileUpload;
