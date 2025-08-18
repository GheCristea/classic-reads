import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Avoid throwing at import time in edge/dev; routes can guard
  console.warn('Supabase admin client missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export type PgCatalog = {
  pg_catalog: {
    id: string
    title: string
    authors: string
    issued: string
    language: string
    updated_at: string
  }
}
export const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<PgCatalog>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : undefined

export function getExpiryIso(ttlSeconds: number): string {
  return new Date(Date.now() + ttlSeconds * 1000).toISOString()
}

export function buildStableKey(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  entries.sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(Object.fromEntries(entries))
}


