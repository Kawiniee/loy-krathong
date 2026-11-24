import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { testDatabase } from './database.mjs'

test('private rooms, per-object edits, hidden designs, timed round and ceremony', async t => {
  const { db, addUser, enter, get, act, asUser } = await testDatabase()
  t.after(() => db.close())
  const [first, second, stranger] = Array.from({ length: 3 }, randomUUID)
  for (const user of [first, second, stranger]) await addUser(user)
  const { id, code } = await enter(first, null, 'น้ำ')

  await t.test('invite, capacity, refresh, and RLS isolation', async () => {
    assert.match(code, /^[0-9A-F]{16}$/)
    await assert.rejects(get(stranger, id), /room_unavailable/)
    await assert.rejects(act(stranger, id, { type: 'heartbeat' }), /room_unavailable/)
    assert.equal((await asUser(stranger, 'select * from public.lk_signal where id = $1', [id])).rows.length, 0)
    assert.equal((await enter(second, code, 'ฟ้า', 3)).seat, 2)
    assert.equal((await enter(first, code, 'ชื่อใหม่')).players[0].name, 'น้ำ')
    assert.equal((await get(first, id)).players.length, 2)
    assert.equal((await asUser(first, 'select * from public.lk_signal where id = $1', [id])).rows.length, 1)
    await assert.rejects(asUser(first, 'select * from lk.pieces'), /permission denied/)
    await assert.rejects(asUser(first, 'update public.lk_signal set rev=42 where id=$1', [id]), /permission denied/)
    await assert.rejects(enter(stranger, code, 'สาม'), /room_full/)
  })

  const base = { id: randomUUID(), material: 'banana', x: 240, y: 240, z: -1, size: 250, rotation: 0 }
  const flower = { id: randomUUID(), material: 'lotus-pink', x: 180, y: 260, z: 1, size: 66, rotation: 38 }
  const edit = (uid, board, piece, expected = 0, roundId) =>
    act(uid, id, { type: 'edit', board, changes: [{ id: piece.id, expected, piece }], roundId })

  await t.test('edits merge across different objects and reject stale writes', async () => {
    const next = await edit(first, 'shared', base)
    const combined = await edit(second, 'shared', flower)
    assert.equal(combined.boards.shared.length, 2)
    const expected = next.boards.shared[0].rev
    const rotated = { ...base, rotation: 20 }
    await edit(second, 'shared', rotated, expected)
    await assert.rejects(edit(first, 'shared', { ...base, x: 210 }, expected), /edit_conflict/)
    const saved = (await get(first, id)).boards.shared
    assert.deepEqual(saved, [{ ...rotated, rev: saved[0].rev }, { ...flower, rev: saved[1].rev }])
    await assert.rejects(edit(first, 'own2', base), /board_locked/)
  })

  await t.test('gift secrecy lasts until both people are ready', async () => {
    await edit(first, 'gift1', base)
    await edit(second, 'gift2', flower)
    assert.equal((await get(second, id)).boards.gift1, undefined)
    await act(first, id, { type: 'gift', ready: true })
    await assert.rejects(edit(first, 'gift1', flower), /board_locked/)
    assert.equal((await get(second, id)).boards.gift1, undefined)
    assert.equal((await act(second, id, { type: 'gift', ready: true })).boards.gift1.length, 1)
  })

  await t.test('ceremony uses exact geometry and freezes it at the server countdown', async () => {
    const launch = { type: 'launch', launch: { board: 'shared', candle: true, incense: true, position: .3, ready: true } }
    const waiting = await act(first, id, launch)
    assert.equal(waiting.ceremony, null)
    const both = await act(second, id, { ...launch, launch: { ...launch.launch, board: 'gift1', position: .7 } })
    assert.ok(both.ceremony.at - both.now <= 3000 && both.ceremony.at - both.now > 2800)
    assert.equal(both.ceremony.boats.length, 2)
    assert.deepEqual(both.ceremony.boats[0].items[1], flower)
    assert.deepEqual(both.ceremony.boats[1].items[0], base)
    const original = both.ceremony
    await edit(first, 'shared', { ...flower, size: 90 }, waiting.boards.shared[1].rev)
    assert.deepEqual((await get(first, id)).ceremony, original)
  })

  await t.test('challenge enforces start, expiry, secrecy and reactions', async () => {
    const { round } = await act(first, id, { type: 'round', duration: 60 })
    await assert.rejects(edit(first, 'round1', base, 0, round.id), /round_closed/)
    await db.query("update lk.rooms set round = jsonb_set(round,'{ends}',to_jsonb(lk.ms()+10000)) where id=$1", [id])
    await edit(first, 'round1', base, 0, round.id)
    assert.equal((await get(second, id)).boards.round1, undefined)
    await db.query("update lk.rooms set round = jsonb_set(round,'{ends}',to_jsonb(lk.ms()-1000)) where id=$1", [id])
    assert.equal((await get(second, id)).boards.round1.length, 1)
    assert.equal((await act(second, id, { type: 'reaction', roundId: round.id, reaction: 'สวยจัง' })).players[1].reaction, 'สวยจัง')
    await assert.rejects(edit(first, 'round1', flower, 0, round.id), /round_closed/)
  })
})
