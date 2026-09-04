-- Capital % of equity used as margin per trade, and coins scanned per cron tick.
alter table desk_settings add column if not exists capital_pct double precision not null default 10;
alter table desk_settings add column if not exists scan_batch integer not null default 40;
