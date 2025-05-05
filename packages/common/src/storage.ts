import { SupabaseClient } from '@supabase/supabase-js';
import { v4 } from 'uuid';

export const DOCUMENT_BUCKET = 'files';

export const baseUploadDocument = async (
  supabase: SupabaseClient,
  file: File,
) => {
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(v4(), file);
  if (error) throw error;

  return data.path;
};

export const baseDownloadDocument = async (
  supabase: SupabaseClient,
  path: string,
  name: string,
) => {
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .download(path);

  if (error) throw error;

  return new File([data], name);
};
