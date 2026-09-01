-- Carivo database schema for Supabase/PostgreSQL
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  brand text,
  model text,
  year text,
  mileage text,
  price bigint,
  city text,
  fuel text,
  transmission text,
  color text,
  description text,
  status text not null default 'active' check (status in ('active','sold','hidden')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;

create policy "profiles public read" on public.profiles for select using (true);
create policy "users create own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "listings public read active" on public.listings for select using (status = 'active' or auth.uid() = seller_id);
create policy "users create own listings" on public.listings for insert with check (auth.uid() = seller_id);
create policy "users update own listings" on public.listings for update using (auth.uid() = seller_id);
create policy "users delete own listings" on public.listings for delete using (auth.uid() = seller_id);

create policy "listing images public read" on public.listing_images for select using (true);
create policy "listing owners add images" on public.listing_images for insert with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));
create policy "listing owners delete images" on public.listing_images for delete using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

create policy "users read own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "users add own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "users remove own favorites" on public.favorites for delete using (auth.uid() = user_id);

-- Storage bucket for vehicle photos. Create the bucket in Supabase Storage as: car-images
-- Recommended auth flow: Supabase Auth email/password or phone OTP.
