-- One finished meal, the picture it completed and its stamp, written in one transaction,
-- so a half-saved meal can't leave the picture carry out of step with the records.
-- Ids come from the device, so a retry is insert-or-skip and never duplicates.
-- security invoker: the RLS policies of 0001 still decide what the parent may write.

create or replace function nyamnyam.save_meal(p_meal jsonb, p_picture jsonb, p_stamp boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into nyamnyam.meals
    (id, child_id, started_at, ended_at, served_g, eaten_g, max_progress, completed, ended_by)
  values (
    (p_meal->>'id')::uuid,
    (p_meal->>'child_id')::uuid,
    (p_meal->>'started_at')::timestamptz,
    (p_meal->>'ended_at')::timestamptz,
    (p_meal->>'served_g')::int,
    (p_meal->>'eaten_g')::int,
    (p_meal->>'max_progress')::real,
    (p_meal->>'completed')::boolean,
    p_meal->>'ended_by'
  )
  on conflict (id) do nothing;

  if p_picture is not null then
    insert into nyamnyam.pictures (id, child_id, completed_at, map, character, meal_ids)
    values (
      (p_picture->>'id')::uuid,
      (p_meal->>'child_id')::uuid,
      -- Same clock as meals.ended_at, which the child screen compares against.
      (p_meal->>'ended_at')::timestamptz,
      p_picture->>'map',
      p_picture->>'character',
      array(select jsonb_array_elements_text(p_picture->'meal_ids'))::uuid[]
    )
    on conflict (id) do nothing;
  end if;

  if p_stamp then
    -- The day the meal ended (Korea time), not the day a delayed retry got through.
    insert into nyamnyam.stamps (child_id, meal_id, date)
    values (
      (p_meal->>'child_id')::uuid,
      (p_meal->>'id')::uuid,
      ((p_meal->>'ended_at')::timestamptz at time zone 'Asia/Seoul')::date
    )
    on conflict (meal_id) do nothing;
  end if;
end $$;

revoke execute on function nyamnyam.save_meal(jsonb, jsonb, boolean) from public, anon;
grant execute on function nyamnyam.save_meal(jsonb, jsonb, boolean) to authenticated;
