create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  purchase_date date not null,
  expiration_date date,
  amount numeric not null default 1,
  unit text not null default 'g/ml',
  category text not null,
  notes text not null default '',
  is_frozen boolean not null default false,
  frozen_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  amount numeric,
  unit text not null default '',
  created_at timestamptz not null default now()
);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.food_items enable row level security;
alter table public.shopping_items enable row level security;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_food_items_updated_at on public.food_items;
create trigger touch_food_items_updated_at
before update on public.food_items
for each row execute function public.touch_updated_at();

drop policy if exists "members can read households" on public.households;
create policy "members can read households"
on public.households for select
using (public.is_household_member(id));

drop policy if exists "authenticated users can create households" on public.households;
create policy "authenticated users can create households"
on public.households for insert
with check (auth.uid() = created_by);

drop policy if exists "members can read household members" on public.household_members;
create policy "members can read household members"
on public.household_members for select
using (public.is_household_member(household_id));

drop policy if exists "users can join themselves" on public.household_members;

drop policy if exists "members can read food items" on public.food_items;
create policy "members can read food items"
on public.food_items for select
using (public.is_household_member(household_id));

drop policy if exists "members can create food items" on public.food_items;
create policy "members can create food items"
on public.food_items for insert
with check (public.is_household_member(household_id));

drop policy if exists "members can update food items" on public.food_items;
create policy "members can update food items"
on public.food_items for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can delete food items" on public.food_items;
create policy "members can delete food items"
on public.food_items for delete
using (public.is_household_member(household_id));

drop policy if exists "members can read shopping items" on public.shopping_items;
create policy "members can read shopping items"
on public.shopping_items for select
using (public.is_household_member(household_id));

drop policy if exists "members can create shopping items" on public.shopping_items;
create policy "members can create shopping items"
on public.shopping_items for insert
with check (public.is_household_member(household_id));

drop policy if exists "members can delete shopping items" on public.shopping_items;
create policy "members can delete shopping items"
on public.shopping_items for delete
using (public.is_household_member(household_id));

create or replace function public.create_household(household_name text, household_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.households (name, invite_code, created_by)
  values (household_name, household_invite_code, auth.uid())
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, auth.uid(), 'owner');

  return new_household_id;
end;
$$;

create or replace function public.join_household(household_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into target_household_id
  from public.households
  where invite_code = household_invite_code;

  if target_household_id is null then
    raise exception 'Household not found';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
$$;
