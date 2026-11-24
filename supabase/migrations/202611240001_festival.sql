begin;

create schema lk;
revoke all on schema lk from public, anon, authenticated;

create table lk.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) || substr(gen_random_uuid()::text, 1, 4)),
  rev bigint not null default 0,
  round jsonb,
  ceremony jsonb
);
create table lk.players (
  room_id uuid not null references lk.rooms on delete cascade,
  seat integer not null check (seat in (1, 2)),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  avatar integer not null check (avatar between 0 and 3),
  activity text not null default 'festival',
  seen bigint not null,
  gift_ready boolean not null default false,
  launch jsonb not null,
  reaction text not null default '',
  primary key (room_id, seat),
  unique (room_id, user_id)
);
create table lk.pieces (
  room_id uuid not null references lk.rooms on delete cascade,
  board text not null check (board in ('own1','own2','shared','gift1','gift2','round1','round2')),
  id uuid not null,
  rev bigint not null,
  piece jsonb not null,
  primary key (room_id, board, id)
);
alter table lk.rooms enable row level security;
alter table lk.players enable row level security;
alter table lk.pieces enable row level security;

-- Only an invalidation signal enters Realtime. Private designs, identities and room codes stay in RPC responses.
create table public.lk_signal (
  id uuid primary key references lk.rooms on delete cascade,
  rev bigint not null default 0
);
alter table public.lk_signal enable row level security;
revoke all on public.lk_signal from public, anon, authenticated;
grant select on public.lk_signal to authenticated;

create function lk.is_member(r uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from lk.players where room_id = r and user_id = auth.uid())
$$;
revoke all on function lk.is_member(uuid) from public, anon, authenticated;
grant execute on function lk.is_member(uuid) to authenticated;
create policy lk_member_signal on public.lk_signal for select to authenticated using (lk.is_member(id));
alter publication supabase_realtime add table public.lk_signal;

create function lk.ms() returns bigint language sql volatile set search_path = '' as $$
  select floor(extract(epoch from clock_timestamp()) * 1000)::bigint
$$;

create function lk.default_launch(s integer) returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('board', 'own' || s, 'candle', false, 'incense', false, 'position', case s when 1 then 0.3 else 0.7 end, 'ready', false)
$$;

create function lk.snapshot(r uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  seat_no integer;
  room lk.rooms;
  open_gifts boolean;
  ts bigint := lk.ms();
  visible jsonb;
  people jsonb;
begin
  select seat into seat_no from lk.players where room_id = r and user_id = auth.uid();
  if seat_no is null then raise exception 'room_unavailable'; end if;
  select * into room from lk.rooms where id = r for share;
  select count(*) = 2 and bool_and(gift_ready) into open_gifts from lk.players where room_id = r;
  select jsonb_agg(jsonb_build_object(
    'seat', seat, 'name', name, 'avatar', avatar, 'activity', activity, 'seen', seen,
    'giftReady', gift_ready, 'launch', launch, 'reaction', reaction
  ) order by seat) into people from lk.players where room_id = r;
  select coalesce(jsonb_object_agg(board, items), '{}'::jsonb) into visible from (
    select board, jsonb_agg(piece || jsonb_build_object('rev', rev) order by (piece->>'z')::numeric, id) items
    from lk.pieces where room_id = r and
      (board in ('own1','own2','shared','gift' || seat_no,'round' || seat_no)
        or (open_gifts and board in ('gift1','gift2'))
        or (ts >= (room.round->>'ends')::bigint and board in ('round1','round2')))
    group by board
  ) data;
  return jsonb_build_object('id', r, 'code', room.code, 'rev', room.rev, 'seat', seat_no,
    'now', ts, 'players', people, 'boards', visible, 'round', room.round, 'ceremony', room.ceremony);
end
$$;

create function public.lk_get(r uuid) returns jsonb language sql security definer set search_path = '' as $$
  select lk.snapshot(r)
$$;

create function public.lk_enter(invite text, player_name text, player_avatar integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  room lk.rooms;
  seat_no integer;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'room_unavailable'; end if;
  if length(trim(player_name)) not between 1 and 24 or player_avatar not between 0 and 3 then
    raise exception 'invalid_profile';
  end if;
  if invite is null then
    insert into lk.rooms default values returning * into room;
    insert into public.lk_signal(id) values (room.id);
  else
    select * into room from lk.rooms where code = upper(trim(invite)) for update;
    if not found then raise exception 'room_unavailable'; end if;
  end if;
  select seat into seat_no from lk.players where room_id = room.id and user_id = uid;
  if seat_no is null then
    select s into seat_no from generate_series(1,2) s
      where not exists(select 1 from lk.players where room_id = room.id and seat = s) order by s limit 1;
    if seat_no is null then raise exception 'room_full'; end if;
    insert into lk.players(room_id, seat, user_id, name, avatar, seen, launch)
      values (room.id, seat_no, uid, trim(player_name), player_avatar, lk.ms(), lk.default_launch(seat_no));
    update lk.rooms set rev = rev + 1 where id = room.id returning * into room;
    update public.lk_signal set rev = room.rev where id = room.id;
  end if;
  return lk.snapshot(room.id);
end
$$;

create function public.lk_action(r uuid, a jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  room lk.rooms;
  me lk.players;
  ts bigint;
  new_rev bigint;
  action_type text := a->>'type';
  b text;
  change jsonb;
  new_piece jsonb;
  piece_id uuid;
  old_rev bigint;
  duration integer;
  ready boolean;
  selected_launch jsonb;
  open_gifts boolean;
begin
  select * into me from lk.players where room_id = r and user_id = auth.uid();
  if not found then raise exception 'room_unavailable'; end if;
  select * into room from lk.rooms where id = r for update;
  select * into me from lk.players where room_id = r and user_id = auth.uid();
  ts := lk.ms();
  new_rev := room.rev + 1;
  select count(*) = 2 and bool_and(gift_ready) into open_gifts from lk.players where room_id = r;

  case action_type
  when 'heartbeat' then
    if ts - me.seen < 12000 then return lk.snapshot(r); end if;
  when 'activity' then
    if coalesce(a->>'activity','') not in ('festival','workshop','challenge','river','photo') then raise exception 'invalid_action'; end if;
    update lk.players set activity = a->>'activity' where room_id = r and seat = me.seat;
  when 'edit' then
    b := a->>'board';
    if b is null or b not in ('own' || me.seat, 'shared', 'gift' || me.seat, 'round' || me.seat)
      or (b = 'gift' || me.seat and me.gift_ready)
    then raise exception 'board_locked'; end if;
    if b = 'round' || me.seat and (
      room.round is null or (room.round->>'id') is distinct from (a->>'roundId')
      or ts < (room.round->>'ends')::bigint - (room.round->>'duration')::int * 1000
      or ts >= (room.round->>'ends')::bigint
    ) then raise exception 'round_closed'; end if;
    if coalesce(jsonb_typeof(a->'changes'),'') <> 'array' or jsonb_array_length(a->'changes') not between 1 and 300
      then raise exception 'invalid_action'; end if;
    for change in select value from jsonb_array_elements(a->'changes') loop
      piece_id := (change->>'id')::uuid;
      select rev into old_rev from lk.pieces where room_id = r and board = b and id = piece_id;
      if coalesce(old_rev,0) is distinct from (change->>'expected')::bigint then raise exception 'edit_conflict'; end if;
      new_piece := change->'piece';
      if new_piece = 'null'::jsonb then
        delete from lk.pieces where room_id = r and board = b and id = piece_id;
      else
        if coalesce(new_piece->>'material','') not in ('trunk','banana','lotus-base','fold','fold-round','fold-fan',
          'lotus-pink','lotus-white','lotus-purple','marigold','jasmine','rose','orchid','petals','incense','candle','beads')
          or not coalesce((new_piece->>'x')::numeric between 0 and 480 and (new_piece->>'y')::numeric between 0 and 480
            and (new_piece->>'rotation')::numeric between -360 and 360 and (new_piece->>'size')::numeric between 12 and 460
            and (new_piece->>'z')::numeric between -1000000 and 1000000, false)
        then raise exception 'invalid_piece'; end if;
        insert into lk.pieces(room_id, board, id, rev, piece) values (r, b, piece_id, new_rev, jsonb_build_object(
          'id', piece_id, 'material', new_piece->>'material', 'x', (new_piece->>'x')::numeric, 'y', (new_piece->>'y')::numeric,
          'rotation', (new_piece->>'rotation')::numeric, 'size', (new_piece->>'size')::numeric, 'z', (new_piece->>'z')::numeric
        )) on conflict (room_id, board, id) do update set rev = excluded.rev, piece = excluded.piece;
      end if;
    end loop;
    if (select count(*) from lk.pieces where room_id = r and board = b) > 300 then raise exception 'board_limit'; end if;
    if room.ceremony is null then
      update lk.players set launch = jsonb_set(lk.players.launch,'{ready}','false') where room_id = r
        and lk.players.launch->>'board' = b and lk.players.launch->>'ready' = 'true';
    end if;
  when 'gift' then
    if open_gifts then raise exception 'board_locked'; end if;
    ready := (a->>'ready')::boolean;
    if ready and not exists(select 1 from lk.pieces where room_id = r and board = 'gift' || me.seat) then raise exception 'empty_board'; end if;
    update lk.players set gift_ready = ready where room_id = r and seat = me.seat;
  when 'launch' then
    if room.ceremony is not null then raise exception 'river_started'; end if;
    selected_launch := a->'launch';
    b := selected_launch->>'board';
    if not coalesce(b in ('own' || me.seat,'shared') or (open_gifts and b = 'gift' || (3 - me.seat)),false)
      or not coalesce((selected_launch->>'position')::numeric between 0.1 and 0.9,false)
      or coalesce(jsonb_typeof(selected_launch->'candle'),'') <> 'boolean'
      or coalesce(jsonb_typeof(selected_launch->'incense'),'') <> 'boolean'
      or coalesce(jsonb_typeof(selected_launch->'ready'),'') <> 'boolean'
    then raise exception 'invalid_action'; end if;
    if (selected_launch->>'ready')::boolean and not exists(select 1 from lk.pieces where room_id = r and board = b) then
      raise exception 'empty_board';
    end if;
    update lk.players set launch = jsonb_build_object('board',b,'position',(selected_launch->>'position')::numeric,
      'candle',(selected_launch->>'candle')::boolean,'incense',(selected_launch->>'incense')::boolean,'ready',(selected_launch->>'ready')::boolean)
      where room_id = r and seat = me.seat;
    if (select count(*) = 2 and bool_and((p.launch->>'ready')::boolean) from lk.players p where p.room_id = r) then
      select jsonb_build_object('at',ts + 3000,'boats',jsonb_agg(jsonb_build_object(
        'seat',p.seat,'name',p.name,'candle',p.launch->'candle','incense',p.launch->'incense','position',p.launch->'position',
        'items',(select jsonb_agg(i.piece order by (i.piece->>'z')::numeric, i.id) from lk.pieces i where i.room_id = r and i.board = p.launch->>'board')
      ) order by p.seat)) into room.ceremony from lk.players p where p.room_id = r;
    end if;
  when 'reset-river' then
    if room.ceremony is null or ts < (room.ceremony->>'at')::bigint then raise exception 'river_started'; end if;
    room.ceremony := null;
    update lk.players set launch = jsonb_set(lk.players.launch,'{ready}','false') where room_id = r;
  when 'round' then
    duration := (a->>'duration')::integer;
    if not coalesce(duration in (60,120,180),false)
      or (room.round->>'ends')::bigint > ts or (select count(*) from lk.players where room_id = r) < 2
    then raise exception 'round_closed'; end if;
    room.round := jsonb_build_object('id',gen_random_uuid(),'theme',floor(random()*5),'duration',duration,'ends',ts + 3000 + duration * 1000);
    delete from lk.pieces where room_id = r and board in ('round1','round2');
    update lk.players set reaction = '' where room_id = r;
  when 'reaction' then
    if room.round is null or room.round->>'id' is distinct from a->>'roundId' or (room.round->>'ends')::bigint > ts
      or coalesce(a->>'reaction','') not in ('สวยจัง','สร้างสรรค์มาก','อยากเอาไปลอย!')
    then raise exception 'round_closed'; end if;
    update lk.players set reaction = a->>'reaction' where room_id = r and seat = me.seat;
  else raise exception 'invalid_action';
  end case;
  update lk.players set seen = ts where room_id = r and seat = me.seat;
  update lk.rooms set rev = new_rev, ceremony = room.ceremony, round = room.round where id = r;
  update public.lk_signal set rev = new_rev where id = r;
  return lk.snapshot(r);
end
$$;

revoke all on function public.lk_enter(text,text,integer), public.lk_get(uuid), public.lk_action(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.lk_enter(text,text,integer), public.lk_get(uuid), public.lk_action(uuid,jsonb) to authenticated;
commit;
