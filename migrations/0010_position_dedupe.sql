-- One fill per signal candle. Re-opening the same bar after SL was the
-- GRASS/BNB clone bug. Also restore paper equity after dropping clones.
alter table positions add column if not exists bar_time bigint;
alter table desk_settings add column if not exists tick_lock_at timestamptz;

delete from positions a
using positions b
where a.id > b.id
  and a.bar_time is not null
  and b.bar_time is not null
  and a.bar_time <> 0
  and a.bar_time = b.bar_time
  and a.symbol = b.symbol
  and a.timeframe = b.timeframe
  and a.indicator = b.indicator;

delete from positions a
using positions b
where a.id > b.id
  and a.symbol = b.symbol
  and a.timeframe = b.timeframe
  and a.indicator = b.indicator
  and a.side = b.side
  and round(a.entry::numeric, 8) = round(b.entry::numeric, 8);

create unique index if not exists positions_dedupe_idx
  on positions (symbol, timeframe, indicator, bar_time)
  where bar_time is not null and bar_time <> 0;

update desk_settings
set equity_usd = starting_equity_usd + coalesce((
  select sum(coalesce(pnl_usd, 0)) from positions where status = 'closed'
), 0),
    updated_at = now()
where id = 1;
