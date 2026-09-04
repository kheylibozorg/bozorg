-- Two crons (Cloudflare + cron-job.org) can overlap. One row per candle signal.
delete from signals a
using signals b
where a.id > b.id
  and a.symbol = b.symbol
  and a.timeframe = b.timeframe
  and a.indicator = b.indicator
  and a.bar_time = b.bar_time;

create unique index if not exists signals_dedupe_idx
  on signals (symbol, timeframe, indicator, bar_time);
