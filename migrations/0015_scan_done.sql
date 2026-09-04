-- Per-TF "this closed bar is fully swept" so a 1-minute cron can finish
-- the universe across several ticks without re-taking an old candle.
alter table desk_settings add column if not exists scan_epoch_ms bigint not null default 0;
alter table desk_settings add column if not exists scan_done_5m bigint not null default 0;
alter table desk_settings add column if not exists scan_done_15m bigint not null default 0;
alter table desk_settings add column if not exists scan_done_1h bigint not null default 0;
alter table desk_settings add column if not exists scan_done_4h bigint not null default 0;
