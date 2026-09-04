create unique index if not exists signals_dedupe_idx
  on signals (symbol, timeframe, indicator, bar_time);
