begin;

create or replace function lk.material_available(material text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(material in (
    'trunk', 'banana', 'lotus-base', 'fold', 'fold-round', 'fold-fan',
    'lotus-pink', 'lotus-white', 'lotus-purple', 'marigold', 'jasmine', 'rose', 'orchid', 'petals', 'incense', 'candle', 'beads',
    'woven-base', 'lilypad-base', 'moon-base', 'reef-base', 'galaxy-base',
    'fern', 'monstera', 'ginkgo', 'bamboo', 'frost-sprig',
    'sunflower', 'butterfly-pea', 'hibiscus', 'sakura', 'chrysanthemum', 'lavender',
    'lotus-candle', 'star-candle', 'lantern', 'bunting', 'garland', 'firework',
    'koi', 'turtle', 'sea-shell', 'coral', 'pearl',
    'crystal', 'star', 'comet', 'potion', 'dragon-egg',
    'mushroom', 'butterfly', 'bridge', 'cloud'
  ), false)
$$;
revoke all on function lk.material_available(text) from public, anon, authenticated;

-- Extract the original allowlist so existing room logic, grants and policies are preserved.
do $migration$
declare
  existing text := pg_get_functiondef('public.lk_action(uuid,jsonb)'::regprocedure);
  updated text;
begin
  if position('not lk.material_available(new_piece->>''material'')' in existing) > 0 then
    return;
  end if;
  updated := regexp_replace(existing,
    $pattern$coalesce\(new_piece->>'material',''\) not in \('trunk','banana','lotus-base',[[:space:]'a-z,-]+,'beads'\)$pattern$,
    $replacement$not lk.material_available(new_piece->>'material')$replacement$);
  if updated = existing then
    raise exception 'Unexpected lk_action material validation. Apply the original festival migration first.';
  end if;
  execute updated;
end
$migration$;

commit;
