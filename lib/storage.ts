import { createClient } from '@supabase/supabase-js';

const allowed = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_STORAGE_BUCKET = 'inspection-images';

export function validateImage(file: File) {
  if (!allowed.includes(file.type)) throw new Error('Only JPG, PNG, and WEBP images are allowed.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Images must be smaller than 8MB.');
}

export function deriveSupabaseUrlFromDatabaseUrl(databaseUrl?: string) {
  if (!databaseUrl) return null;

  try {
    const parsed = new URL(databaseUrl);
    const directHostMatch = parsed.hostname.match(/^db\.([a-z0-9-]+)\.supabase\.co$/i);
    if (directHostMatch?.[1]) return `https://${directHostMatch[1]}.supabase.co`;

    const username = decodeURIComponent(parsed.username);
    const poolerUserMatch = username.match(/^postgres\.([a-z0-9-]+)$/i);
    if (poolerUserMatch?.[1]) return `https://${poolerUserMatch[1]}.supabase.co`;
  } catch {
    return null;
  }

  return null;
}

function getSupabaseStorageConfig() {
  const url = (process.env.SUPABASE_URL || process.env.SUPABASE_URI)?.replace(/\/$/, '') || deriveSupabaseUrlFromDatabaseUrl(process.env.DATABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;

  if (!url) {
    throw new Error(
      'Supabase Storage uploads require SUPABASE_URL on the server.'
    );
  }

  if (!key) {
    throw new Error('Supabase Storage uploads require SUPABASE_SERVICE_ROLE_KEY on the server.');
  }

  return { url, key, bucket };
}

export async function uploadInspectionImage(file: File, responseId: string) {
  validateImage(file);

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const storagePath = `inspections/${responseId}/${Date.now()}-${safe}`;
  const { url, key, bucket } = getSupabaseStorageConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return { url: data.publicUrl, storagePath, fileName: file.name, fileType: file.type, fileSize: file.size };
}
