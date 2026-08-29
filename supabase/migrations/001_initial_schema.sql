-- Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  username text unique,
  username_lower text unique,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  drive_folder_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Finances
create table public.finances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  title text not null,
  amount decimal not null,
  category text not null,
  note text,
  date date not null default current_date
);

alter table public.finances enable row level security;

create policy "Users manage own finances"
  on public.finances for all using (auth.uid() = user_id);

-- Movies
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  media_type text not null check (media_type in ('movie', 'series')),
  status text not null default 'planned' check (status in ('watching', 'completed', 'planned')),
  rating int check (rating between 1 and 10),
  poster_url text,
  watched_at date
);

alter table public.movies enable row level security;

create policy "Users manage own movies"
  on public.movies for all using (auth.uid() = user_id);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('concert', 'match')),
  city text not null,
  venue text not null,
  event_date date not null,
  drive_cover text,
  notes text
);

alter table public.events enable row level security;

create policy "Users manage own events"
  on public.events for all using (auth.uid() = user_id);

-- Journal
create table public.journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  mood int check (mood between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.journal enable row level security;

create policy "Users manage own journal"
  on public.journal for all using (auth.uid() = user_id);

-- Journal images
create table public.journal_images (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid references public.journal(id) on delete cascade not null,
  drive_file_id text not null
);

alter table public.journal_images enable row level security;

create policy "Users manage own journal images"
  on public.journal_images for all
  using (exists (
    select 1 from public.journal j where j.id = journal_id and j.user_id = auth.uid()
  ));

-- Places
create table public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  city text not null,
  country text not null,
  rating int check (rating between 1 and 5),
  visited_at date
);

alter table public.places enable row level security;

create policy "Users manage own places"
  on public.places for all using (auth.uid() = user_id);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer text not null,
  stripe_subscription text not null,
  status text not null default 'active' check (status in ('active', 'canceled')),
  renewal_date date
);

alter table public.subscriptions enable row level security;

create policy "Users read own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);
