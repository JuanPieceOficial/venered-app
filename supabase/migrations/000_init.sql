-- Core schema for Venered (Synapse base)

create extension if not exists pgcrypto;

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  bio text,
  avatar_url text,
  website text,
  created_at timestamptz not null default now(),
  posts_count integer not null default 0,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  is_private boolean not null default false
);

-- Banned users
create table if not exists banned_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reason text,
  banned_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  banned_by uuid references profiles(id)
);

alter table banned_users enable row level security;

DROP FUNCTION IF EXISTS is_banned(uuid) CASCADE;
create or replace function is_banned(p_user_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1 from banned_users
    where banned_users.user_id = p_user_id
      and banned_users.is_active = true
      and (banned_users.expires_at is null or banned_users.expires_at > now())
  );
$$;

alter table profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone" on profiles
  for select using (auth.role() = 'authenticated' and not is_banned(auth.uid()));

drop policy if exists "Users can insert their profile" on profiles;
create policy "Users can insert their profile" on profiles
  for insert with check (auth.uid() = id and not is_banned(auth.uid()));

drop policy if exists "Users can update their profile" on profiles;
create policy "Users can update their profile" on profiles
  for update using (auth.uid() = id and not is_banned(auth.uid()));

-- Privacy settings
create table if not exists privacy_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  hide_email boolean not null default true,
  hide_location boolean not null default false,
  hide_website boolean not null default false,
  hide_followers_count boolean not null default false,
  hide_following_count boolean not null default false,
  hide_posts_count boolean not null default false,
  private_posts boolean not null default false,
  allow_message_from_strangers boolean not null default true,
  show_online_status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table privacy_settings enable row level security;

drop policy if exists "Users can view their privacy settings" on privacy_settings;
create policy "Users can view their privacy settings" on privacy_settings
  for select using (auth.uid() = user_id and not is_banned(auth.uid()));

drop policy if exists "Users can insert their privacy settings" on privacy_settings;
create policy "Users can insert their privacy settings" on privacy_settings
  for insert with check (auth.uid() = user_id and not is_banned(auth.uid()));

drop policy if exists "Users can update their privacy settings" on privacy_settings;
create policy "Users can update their privacy settings" on privacy_settings
  for update using (auth.uid() = user_id and not is_banned(auth.uid()));

-- Posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content text,
  image_urls text[],
  video_url text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  likes_count integer not null default 0,
  comments_count integer not null default 0
);

alter table posts enable row level security;

-- Follows
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

alter table follows enable row level security;

drop policy if exists "Follows are viewable by authenticated users" on follows;
create policy "Follows are viewable by authenticated users" on follows
  for select using (auth.role() = 'authenticated' and not is_banned(auth.uid()));

drop policy if exists "Users can follow" on follows;
create policy "Users can follow" on follows
  for insert with check (auth.uid() = follower_id and not is_banned(auth.uid()));

drop policy if exists "Users can unfollow" on follows;
create policy "Users can unfollow" on follows
  for delete using (auth.uid() = follower_id and not is_banned(auth.uid()));

create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

-- Helper functions
DROP FUNCTION IF EXISTS can_view_post(uuid, uuid, boolean) CASCADE;
create or replace function can_view_post(viewer_id uuid, owner_id uuid, post_is_private boolean)
returns boolean
language sql
stable
security definer
as $$
  select
    case
      when viewer_id = owner_id then true
      when exists (
        select 1
        from follows f
        where f.follower_id = viewer_id
          and f.following_id = owner_id
          and f.status = 'accepted'
      ) then true
      when post_is_private = true then false
      else not exists (
        select 1
        from profiles p
        left join privacy_settings ps on ps.user_id = p.id
        where p.id = owner_id
          and (p.is_private = true or coalesce(ps.private_posts, false) = true)
      )
    end;
$$;

drop policy if exists "Posts are viewable by authenticated users" on posts;
create policy "Posts are viewable by authenticated users" on posts
  for select using (
    auth.role() = 'authenticated'
    and not is_banned(auth.uid())
    and can_view_post(auth.uid(), posts.user_id, posts.is_private)
  );

drop policy if exists "Users can insert posts" on posts;
create policy "Users can insert posts" on posts
  for insert with check (auth.uid() = user_id and not is_banned(auth.uid()));

drop policy if exists "Users can update their posts" on posts;
create policy "Users can update their posts" on posts
  for update using (auth.uid() = user_id and not is_banned(auth.uid()));

drop policy if exists "Users can delete their posts" on posts;
create policy "Users can delete their posts" on posts
  for delete using (auth.uid() = user_id and not is_banned(auth.uid()));

create index if not exists idx_posts_user_id on posts(user_id);
create index if not exists idx_posts_created_at on posts(created_at desc);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table comments enable row level security;

drop policy if exists "Comments are viewable by authenticated users" on comments;
create policy "Comments are viewable by authenticated users" on comments
  for select using (
    auth.role() = 'authenticated'
    and not is_banned(auth.uid())
    and exists (
      select 1
      from posts p
      where p.id = comments.post_id
        and can_view_post(auth.uid(), p.user_id, p.is_private)
    )
  );

drop policy if exists "Users can insert comments" on comments;
create policy "Users can insert comments" on comments
  for insert with check (auth.uid() = user_id and not is_banned(auth.uid()));

drop policy if exists "Users can update their comments" on comments;
create policy "Users can update their comments" on comments
  for update using (auth.uid() = user_id and not is_banned(auth.uid()));

drop policy if exists "Users can delete their comments" on comments;
create policy "Users can delete their comments" on comments
  for delete using (auth.uid() = user_id and not is_banned(auth.uid()));

create index if not exists idx_comments_post_id on comments(post_id);

-- Likes
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table likes enable row level security;

drop policy if exists "Likes are viewable by authenticated users" on likes;
create policy "Likes are viewable by authenticated users" on likes
  for select using (auth.role() = 'authenticated' and not is_banned(auth.uid()));

drop policy if exists "Users can like posts" on likes;
create policy "Users can like posts" on likes
  for insert with check (auth.uid() = user_id and not is_banned(auth.uid()));

drop policy if exists "Users can remove their likes" on likes;
create policy "Users can remove their likes" on likes
  for delete using (auth.uid() = user_id and not is_banned(auth.uid()));

create index if not exists idx_likes_post_id on likes(post_id);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  content text,
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  read boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

drop policy if exists "Users can view their messages" on messages;
create policy "Users can view their messages" on messages
  for select using (
    not is_banned(auth.uid())
    and (auth.uid() = sender_id or auth.uid() = receiver_id)
  );

drop policy if exists "Users can send messages" on messages;
create policy "Users can send messages" on messages
  for insert with check (
    auth.uid() = sender_id
    and not is_banned(auth.uid())
    and (
      exists (
        select 1
        from privacy_settings ps
        where ps.user_id = receiver_id
          and ps.allow_message_from_strangers = true
      )
      or exists (
        select 1
        from follows f
        where f.follower_id = auth.uid()
          and f.following_id = receiver_id
          and f.status = 'accepted'
      )
    )
  );

drop policy if exists "Users can update received messages" on messages;
create policy "Users can update received messages" on messages
  for update using (auth.uid() = receiver_id and not is_banned(auth.uid()));

create index if not exists idx_messages_sender_receiver on messages(sender_id, receiver_id);
create index if not exists idx_messages_created_at on messages(created_at);
create index if not exists idx_messages_read on messages(read);

-- Message reactions
create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

alter table message_reactions enable row level security;

drop policy if exists "Users can view message reactions" on message_reactions;
create policy "Users can view message reactions" on message_reactions
  for select using (
    exists (
      select 1
      from messages m
      where m.id = message_reactions.message_id
        and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
    )
  );

drop policy if exists "Users can react to messages" on message_reactions;
create policy "Users can react to messages" on message_reactions
  for insert with check (
    auth.uid() = user_id
    and not is_banned(auth.uid())
    and exists (
      select 1
      from messages m
      where m.id = message_reactions.message_id
        and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
    )
  );

drop policy if exists "Users can remove message reactions" on message_reactions;
create policy "Users can remove message reactions" on message_reactions
  for delete using (auth.uid() = user_id);

create index if not exists idx_message_reactions_message_id on message_reactions(message_id);

-- Typing indicators
create table if not exists message_typing (
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  is_typing boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (sender_id, receiver_id)
);

alter table message_typing enable row level security;

drop policy if exists "Users can view typing status" on message_typing;
create policy "Users can view typing status" on message_typing
  for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

drop policy if exists "Users can set typing status" on message_typing;
create policy "Users can set typing status" on message_typing
  for insert with check (auth.uid() = sender_id and not is_banned(auth.uid()));

drop policy if exists "Users can update typing status" on message_typing;
create policy "Users can update typing status" on message_typing
  for update using (auth.uid() = sender_id and not is_banned(auth.uid()));

create index if not exists idx_message_typing_receiver on message_typing(receiver_id);

DROP FUNCTION IF EXISTS set_message_typing_updated_at() CASCADE;
create or replace function set_message_typing_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_message_typing_updated on message_typing;
create trigger trg_message_typing_updated
before update on message_typing
for each row execute function set_message_typing_updated_at();

-- Conversations summary
DROP FUNCTION IF EXISTS get_conversations(uuid) CASCADE;
create or replace function get_conversations(p_user_id uuid)
returns table(
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  last_message text,
  last_message_time timestamptz,
  unread_count integer,
  is_following boolean
)
language sql
stable
security definer
as $$
  with msgs as (
    select
      m.*, 
      case when m.sender_id = p_user_id then m.receiver_id else m.sender_id end as other_id
    from messages m
    where m.sender_id = p_user_id or m.receiver_id = p_user_id
  ), last_msg as (
    select distinct on (other_id)
      other_id,
      content as last_message,
      created_at as last_message_time
    from msgs
    order by other_id, created_at desc
  ), unread as (
    select sender_id as other_id, count(*)::int as unread_count
    from messages
    where receiver_id = p_user_id and read = false
    group by sender_id
  ), followed as (
    select following_id as other_id, true as is_following
    from follows
    where follower_id = p_user_id
  )
  select
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    lm.last_message,
    lm.last_message_time,
    coalesce(u.unread_count, 0) as unread_count,
    coalesce(f.is_following, false) as is_following
  from last_msg lm
  join profiles p on p.id = lm.other_id
  left join unread u on u.other_id = lm.other_id
  left join followed f on f.other_id = lm.other_id
  order by lm.last_message_time desc;
$$;

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  related_user_id uuid references profiles(id) on delete set null,
  related_post_id uuid references posts(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

drop policy if exists "Users can view their notifications" on notifications;
create policy "Users can view their notifications" on notifications
  for select using (auth.uid() = user_id and not is_banned(auth.uid()));

-- Notification triggers
DROP FUNCTION IF EXISTS notify_on_like() CASCADE;
create or replace function notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = new.post_id;

  if post_owner is null or post_owner = new.user_id then
    return new;
  end if;

  if is_banned(new.user_id) or is_banned(post_owner) then
    return new;
  end if;

  insert into notifications (user_id, related_user_id, related_post_id, type, title, message)
  values (post_owner, new.user_id, new.post_id, 'like', 'Nuevo like', 'Le gustó tu publicación.');

  return new;
end;
$$;

drop trigger if exists trg_notify_like on likes;
create trigger trg_notify_like after insert on likes for each row execute function notify_on_like();

DROP FUNCTION IF EXISTS notify_on_comment() CASCADE;
create or replace function notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = new.post_id;

  if post_owner is null or post_owner = new.user_id then
    return new;
  end if;

  if is_banned(new.user_id) or is_banned(post_owner) then
    return new;
  end if;

  insert into notifications (user_id, related_user_id, related_post_id, type, title, message)
  values (post_owner, new.user_id, new.post_id, 'comment', 'Nuevo comentario', 'Comentó tu publicación.');

  return new;
end;
$$;

drop trigger if exists trg_notify_comment on comments;
create trigger trg_notify_comment after insert on comments for each row execute function notify_on_comment();

DROP FUNCTION IF EXISTS notify_on_follow() CASCADE;
create or replace function notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'accepted' then
    return new;
  end if;

  if is_banned(new.follower_id) or is_banned(new.following_id) then
    return new;
  end if;

  if new.follower_id = new.following_id then
    return new;
  end if;

  insert into notifications (user_id, related_user_id, type, title, message)
  values (new.following_id, new.follower_id, 'follow', 'Nuevo seguidor', 'Empezó a seguirte.');

  return new;
end;
$$;

drop trigger if exists trg_notify_follow on follows;
create trigger trg_notify_follow after insert on follows for each row execute function notify_on_follow();

DROP FUNCTION IF EXISTS notify_on_message() CASCADE;
create or replace function notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_banned(new.sender_id) or is_banned(new.receiver_id) then
    return new;
  end if;

  insert into notifications (user_id, related_user_id, type, title, message)
  values (
    new.receiver_id,
    new.sender_id,
    'message',
    'Nuevo mensaje',
    case 
      when length(new.content) > 50 then left(new.content, 47) || '...'
      else new.content
    end
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_message on messages;
create trigger trg_notify_message after insert on messages for each row execute function notify_on_message();

-- Admin roles
create table if not exists admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'admin',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table admin_roles enable row level security;

-- Admin helper
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
create or replace function is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists(
    select 1 from admin_roles
    where admin_roles.user_id = p_user_id
  );
$$;

DROP FUNCTION IF EXISTS check_username_availability(text) CASCADE;
create or replace function check_username_availability(username_to_check text)
returns boolean
language sql
stable
security definer
as $$
  select not exists(
    select 1 from profiles
    where lower(username) = lower(username_to_check)
  );
$$;

-- Admin RLS policies
drop policy if exists "Admins can view admin roles" on admin_roles;
create policy "Admins can view admin roles" on admin_roles
  for select using (is_admin(auth.uid()) and not is_banned(auth.uid()));

drop policy if exists "Admins can insert admin roles" on admin_roles;
create policy "Admins can insert admin roles" on admin_roles
  for insert with check (is_admin(auth.uid()) and not is_banned(auth.uid()));

drop policy if exists "Admins can view banned users" on banned_users;
create policy "Admins can view banned users" on banned_users
  for select using (is_admin(auth.uid()) and not is_banned(auth.uid()));

drop policy if exists "Admins can manage banned users" on banned_users;
create policy "Admins can manage banned users" on banned_users
  for insert with check (is_admin(auth.uid()) and not is_banned(auth.uid()));

drop policy if exists "Admins can update banned users" on banned_users;
create policy "Admins can update banned users" on banned_users
  for update using (is_admin(auth.uid()) and not is_banned(auth.uid()));

-- Trigger to keep updated_at for privacy_settings
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
create or replace function set_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_privacy_settings_updated on privacy_settings;
create trigger trg_privacy_settings_updated
before update on privacy_settings
for each row execute function set_updated_at();

DROP FUNCTION IF EXISTS update_posts_count() CASCADE;
create or replace function update_posts_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update profiles
    set posts_count = posts_count + 1
    where id = new.user_id;
  elsif tg_op = 'DELETE' then
    update profiles
    set posts_count = greatest(posts_count - 1, 0)
    where id = old.user_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_posts_count on posts;
create trigger trg_posts_count
after insert or delete on posts
for each row execute function update_posts_count();

DROP FUNCTION IF EXISTS update_comments_count() CASCADE;
create or replace function update_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update posts
    set comments_count = comments_count + 1
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts
    set comments_count = greatest(comments_count - 1, 0)
    where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comments_count on comments;
create trigger trg_comments_count
after insert or delete on comments
for each row execute function update_comments_count();

DROP FUNCTION IF EXISTS update_likes_count() CASCADE;
create or replace function update_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update posts
    set likes_count = likes_count + 1
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts
    set likes_count = greatest(likes_count - 1, 0)
    where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_likes_count on likes;
create trigger trg_likes_count
after insert or delete on likes
for each row execute function update_likes_count();

DROP FUNCTION IF EXISTS update_follow_counts() CASCADE;
create or replace function update_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update profiles
    set following_count = following_count + 1
    where id = new.follower_id;

    update profiles
    set followers_count = followers_count + 1
    where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update profiles
    set following_count = greatest(following_count - 1, 0)
    where id = old.follower_id;

    update profiles
    set followers_count = greatest(followers_count - 1, 0)
    where id = old.following_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_follow_counts on follows;
create trigger trg_follow_counts
after insert or delete on follows
for each row execute function update_follow_counts();

-- Create profile on signup
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text;
begin
  desired_username := coalesce(new.raw_user_meta_data->>'username', '');
  if desired_username = '' then
    desired_username := 'user_' || replace(new.id::text, '-', '');
  end if;

  if exists (select 1 from profiles where lower(username) = lower(desired_username)) then
    desired_username := 'user_' || replace(new.id::text, '-', '');
  end if;

  insert into profiles (id, username, full_name)
  values (
    new.id,
    desired_username,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario')
  );
  insert into privacy_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_user();

-- Borra datos de la app y resetea IDs
truncate table
  notifications,
  message_reactions,
  message_typing,
  messages,
  comments,
  likes,
  follows,
  posts,
  profiles,
  privacy_settings,
  banned_users,
  admin_roles
restart identity cascade;