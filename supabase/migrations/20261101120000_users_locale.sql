alter table public.users add column if not exists locale text not null default 'fr' check (locale in ('fr','en'));
