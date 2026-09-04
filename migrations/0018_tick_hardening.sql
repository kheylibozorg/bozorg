-- Per-TF scan cursors so a 15m/1h/4h close can finish the universe
-- across several 1-minute pings without a 5m close resetting the pointer.
alter table desk_settings add column if not exists scan_cursors text not null default '{}';
-- Live fills that the desk failed to row + flatten. Next tick retries.
alter table desk_settings add column if not exists orphan_fills text not null default '[]';
-- Lock holder id so a killed Vercel invoke expires in ~20s, not 70s.
alter table desk_settings add column if not exists tick_lock_id text;
