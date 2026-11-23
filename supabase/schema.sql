-- Resona Database Schema
-- Run this script in the Supabase SQL Editor to set up all tables, triggers, and storage buckets.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  preferred_language text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PODCASTS TABLE
create table if not exists public.podcasts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  script text not null,
  audio_url text,
  style text,
  religion text,
  language text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.podcasts enable row level security;

create policy "Users can view podcasts" on public.podcasts
  for select using (true);

create policy "Users can insert own podcasts" on public.podcasts
  for insert with check (auth.uid() = user_id or auth.uid() is not null);

create policy "Users can update own podcasts" on public.podcasts
  for update using (auth.uid() = user_id);

create policy "Users can delete own podcasts" on public.podcasts
  for delete using (auth.uid() = user_id);

-- 3. GLOBAL PODCASTS TABLE (Social feed)
create table if not exists public.global_podcasts (
  id uuid default gen_random_uuid() primary key,
  podcast_id uuid references public.podcasts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  caption text,
  style text,
  religion text,
  language text,
  audio_url text not null,
  script text,
  likes_count integer default 0,
  comments_count integer default 0,
  shared_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.global_podcasts enable row level security;

create policy "Anyone can view global podcasts" on public.global_podcasts
  for select using (true);

create policy "Users can insert global podcasts" on public.global_podcasts
  for insert with check (auth.uid() = user_id);

-- 4. GLOBAL PODCAST LIKES
create table if not exists public.global_podcast_likes (
  id uuid default gen_random_uuid() primary key,
  global_podcast_id uuid references public.global_podcasts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(global_podcast_id, user_id)
);

alter table public.global_podcast_likes enable row level security;

create policy "Anyone can view likes" on public.global_podcast_likes
  for select using (true);

create policy "Users can like" on public.global_podcast_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike" on public.global_podcast_likes
  for delete using (auth.uid() = user_id);

-- 5. GLOBAL PODCAST COMMENTS
create table if not exists public.global_podcast_comments (
  id uuid default gen_random_uuid() primary key,
  global_podcast_id uuid references public.global_podcasts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.global_podcast_comments enable row level security;

create policy "Anyone can view comments" on public.global_podcast_comments
  for select using (true);

create policy "Users can insert comments" on public.global_podcast_comments
  for insert with check (auth.uid() = user_id);

-- 6. PODCAST COMMENTS (Private / direct)
create table if not exists public.podcast_comments (
  id uuid default gen_random_uuid() primary key,
  podcast_id uuid references public.podcasts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.podcast_comments enable row level security;

create policy "Users can view comments on accessible podcasts" on public.podcast_comments
  for select using (true);

create policy "Users can post comments" on public.podcast_comments
  for insert with check (auth.uid() = user_id);

-- 7. PODCAST REACTIONS
create table if not exists public.podcast_reactions (
  id uuid default gen_random_uuid() primary key,
  podcast_id uuid references public.podcasts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  reaction_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(podcast_id, user_id, reaction_type)
);

alter table public.podcast_reactions enable row level security;

create policy "Anyone can view reactions" on public.podcast_reactions
  for select using (true);

create policy "Users can toggle reactions" on public.podcast_reactions
  for all using (auth.uid() = user_id);

-- 8. FRIENDSHIPS
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  friend_id uuid references auth.users on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.friendships enable row level security;

create policy "Users can view friendships" on public.friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can manage friendships" on public.friendships
  for all using (auth.uid() = user_id or auth.uid() = friend_id);

-- 9. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  sender_id uuid references auth.users on delete cascade not null,
  type text not null,
  message text not null,
  is_read boolean default false,
  related_podcast_id uuid references public.podcasts on delete set null,
  related_global_podcast_id uuid references public.global_podcasts on delete set null,
  related_achievement_id text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

create policy "Users can read own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- 10. USER PREFERENCES
create table if not exists public.user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  style text,
  religion text,
  preference_score integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_preferences enable row level security;

create policy "Users can manage own preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

-- STORAGE BUCKETS SETUP
insert into storage.buckets (id, name, public)
values ('podcasts', 'podcasts', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do nothing;

create policy "Public Access Podcasts" on storage.objects
  for select using (bucket_id = 'podcasts');

create policy "Authenticated Upload Podcasts" on storage.objects
  for insert with check (bucket_id = 'podcasts');

create policy "Public Access Profile Pictures" on storage.objects
  for select using (bucket_id = 'profile-pictures');

create policy "Authenticated Upload Profile Pictures" on storage.objects
  for insert with check (bucket_id = 'profile-pictures');


-- BIAS REVIEW + CONTENT REPORTS
alter table public.podcasts
  add column if not exists bias_check jsonb,
  add column if not exists bias_retries integer default 0;

create table if not exists public.content_reports (
  id uuid default gen_random_uuid() primary key,
  global_podcast_id uuid references public.global_podcasts on delete cascade not null,
  reporter_id uuid references auth.users on delete cascade not null,
  reason text not null check (reason in ('stereotype','inaccurate','offensive','other')),
  details text,
  status text default 'open',
  created_at timestamptz default timezone('utc'::text, now()),
  unique (global_podcast_id, reporter_id)
);

alter table public.content_reports enable row level security;

drop policy if exists "Users can report" on public.content_reports;
create policy "Users can report" on public.content_reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "Users see own reports" on public.content_reports;
create policy "Users see own reports" on public.content_reports
  for select using (auth.uid() = reporter_id);

-- REMOVE PLAIN-TEXT API KEYS (keys now live only in the device secure keystore)
update public.profiles set openrouter_api_key = null where openrouter_api_key is not null;
alter table public.profiles drop column if exists openrouter_api_key;

/*
-- =====================================================
-- REVIEW BEFORE RUNNING: STORAGE POLICY HARDENING
-- =====================================================
-- 1. Podcasts bucket: drop open upload policy for anon/public.
-- Backend audio synthesis runs with service_role key, which bypasses RLS.
drop policy if exists "Allow Upload to Podcasts" on storage.objects;

-- 2. Profile pictures bucket: restrict upload to authenticated users.
-- Note: ProfileScreen.js uploads files as `<user.id>_<timestamp>.<ext>` at the bucket root (not in a user-id subfolder),
-- so an authenticated-role check is applied here.
drop policy if exists "Allow Upload to Profile Pictures" on storage.objects;

create policy "Authenticated users can upload profile pictures" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-pictures');

create policy "Authenticated users can update profile pictures" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-pictures');

create policy "Authenticated users can delete profile pictures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-pictures');
*/

