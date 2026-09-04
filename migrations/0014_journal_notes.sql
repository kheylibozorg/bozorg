-- Operator notes per fill, and a one-shot demo blotter flag.
alter table positions add column if not exists notes text;
alter table desk_settings add column if not exists journal_seeded integer not null default 0;
