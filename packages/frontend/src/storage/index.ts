import { supabase } from '@/utils/supabase';
import { baseUploadDocument } from 'common';

const PUBLIC_BUCKET = 'centrus-public';

export const uploadPublicFile = async (path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(path, file);
  if (error) throw error;

  const response = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(data.path);
  return response.data.publicUrl;
};

export const uploadDocument = async (file: File) => {
  return baseUploadDocument(supabase, file);
};
