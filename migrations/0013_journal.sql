-- Extra blotter fields: original stop, MAE/MFE, hold, signal context.
alter table positions add column if not exists orig_sl double precision;
alter table positions add column if not exists mae_r double precision;
alter table positions add column if not exists mfe_r double precision;
alter table positions add column if not exists bars_held integer;
alter table positions add column if not exists hold_ms bigint;
alter table positions add column if not exists signal_reason text;
alter table positions add column if not exists atr_at_entry double precision;
alter table positions add column if not exists be_moved integer not null default 0;
alter table positions add column if not exists equity_at_open double precision;
alter table positions add column if not exists rr_planned double precision;
alter table positions add column if not exists margin_usd double precision;

update positions
set orig_sl = sl
where orig_sl is null and sl is not null;

update positions
set rr_planned = abs(tp - entry) / nullif(abs(entry - coalesce(orig_sl, sl)), 0)
where rr_planned is null
  and entry is not null
  and tp is not null;

update positions
set margin_usd = notional_usd / nullif(leverage, 0)
where margin_usd is null
  and notional_usd is not null
  and leverage is not null
  and leverage <> 0;
