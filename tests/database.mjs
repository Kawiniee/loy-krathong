import { readFile, readdir } from 'node:fs/promises'
import { URL } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

export async function testDatabase() {
  const db = new PGlite()
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create publication supabase_realtime;
  `)
  const migrations = new URL('../supabase/migrations/', import.meta.url)
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'))
  }

  async function asUser(uid, query, params) {
    return db.transaction(async tx => {
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [uid])
      await tx.exec('set local role authenticated')
      return tx.query(query, params)
    })
  }
  return {
    db, asUser,
    addUser: async uid => db.query('insert into auth.users(id) values ($1)', [uid]),
    enter: async (uid, code, name, avatar = 0) => (await asUser(uid, 'select public.lk_enter($1,$2,$3) as value', [code, name, avatar])).rows[0].value,
    get: async (uid, id) => (await asUser(uid, 'select public.lk_get($1) as value', [id])).rows[0].value,
    act: async (uid, id, action) => (await asUser(uid, 'select public.lk_action($1,$2) as value', [id, JSON.stringify(action)])).rows[0].value,
  }
}
