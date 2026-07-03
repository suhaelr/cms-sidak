
-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'uploads');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads');

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'uploads');
