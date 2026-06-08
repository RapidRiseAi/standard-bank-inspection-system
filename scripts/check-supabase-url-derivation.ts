import { deriveSupabaseUrlFromDatabaseUrl } from '../lib/storage';

const cases = [
  {
    name: 'direct Supabase database host',
    databaseUrl: 'postgresql://postgres:password@db.abcdefghijklmnopqrst.supabase.co:5432/postgres?schema=public',
    expected: 'https://abcdefghijklmnopqrst.supabase.co',
  },
  {
    name: 'URL-encoded Supabase pooler username project ref',
    databaseUrl:
      'postgresql://postgres%2Eabcdefghijklmnopqrst:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    expected: 'https://abcdefghijklmnopqrst.supabase.co',
  },
  {
    name: 'Supabase pooler username project ref',
    databaseUrl:
      'postgresql://postgres.abcdefghijklmnopqrst:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public',
    expected: 'https://abcdefghijklmnopqrst.supabase.co',
  },
];

for (const testCase of cases) {
  const actual = deriveSupabaseUrlFromDatabaseUrl(testCase.databaseUrl);
  if (actual !== testCase.expected) {
    throw new Error(`${testCase.name}: expected ${testCase.expected}, received ${actual}`);
  }
}

console.log(`Supabase URL derivation passed for ${cases.length} database URL formats.`);
