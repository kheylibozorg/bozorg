-- User cap on leverage. Bot still never exceeds that coin's venue max.
alter table desk_settings add column if not exists max_leverage integer not null default 200;
