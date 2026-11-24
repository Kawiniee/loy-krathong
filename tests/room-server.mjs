import { createHmac, randomUUID } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { testDatabase } from './database.mjs'

// Browser integration fixture. Auth and PostgREST are local shims, and requests
// execute the actual PostgreSQL functions as the signed-in test user.
const database = await testDatabase()
const secret = randomUUID()
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const sign = data => createHmac('sha256', secret).update(data).digest('base64url')
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  const send = (data, status = 200) => { res.writeHead(status); res.end(JSON.stringify(data)) }
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.url === '/health') { send({ ready: true }); return }
  try {
    if (req.url?.startsWith('/auth/v1/signup')) {
      const id = randomUUID()
      await database.addUser(id)
      const expires_at = Math.floor(Date.now() / 1000) + 3600
      const user = { id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', role: 'authenticated', is_anonymous: true }
      const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, role: 'authenticated', exp: expires_at })}`
      send({ access_token: `${token}.${sign(token)}`, refresh_token: randomUUID(), expires_in: 3600, expires_at, token_type: 'bearer', user })
      return
    }
    const [header, payload, signature] = (req.headers.authorization ?? '').replace(/^Bearer /, '').split('.')
    if (!signature || sign(`${header}.${payload}`) !== signature) { send({ message: 'invalid_token' }, 401); return }
    const { sub } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const args = JSON.parse(Buffer.concat(chunks).toString())
    switch (req.url) {
      case '/rest/v1/rpc/lk_enter': send(await database.enter(sub, args.invite, args.player_name, args.player_avatar)); break
      case '/rest/v1/rpc/lk_get': send(await database.get(sub, args.r)); break
      case '/rest/v1/rpc/lk_action': send(await database.act(sub, args.r, args.a)); break
      default: send({ message: 'not_found' }, 404)
    }
  } catch (error) {
    send({ message: error.message, code: error.code ?? 'fixture_error' }, 400)
  }
})
server.listen(4410, '127.0.0.1')
