-- Durable cron metadata. Token is never rotated by this migration.
alter table desk_settings add column if not exists last_tick_source text;
alter table scan_log add column if not exists source text not null default 'manual';
create index if not exists scan_log_source_idx on scan_log (source, ts desc);
