-- Apex Desk — single-operator trading journal (unowned rows; personal deployed instance)
create table if not exists desk_settings (
  id integer primary key default 1,
  mode text not null default 'paper',
  venue text not null default 'lighter',
  risk_pct double precision not null default 1.0,
  max_positions integer not null default 4,
  min_market_cap_usd double precision not null default 800000000,
  equity_usd double precision not null default 10000,
  starting_equity_usd double precision not null default 10000,
  live_enabled integer not null default 0,
  bot_enabled integer not null default 1,
  paper_24h integer not null default 1,
  tick_token text not null default 'change-me',
  scan_cursor integer not null default 0,
  last_tick_at timestamptz,
  lighter_api_key text,
  lighter_api_private_key text,
  lighter_account_index integer,
  aster_api_key text,
  aster_api_secret text,
  toobit_api_key text,
  toobit_api_secret text,
  updated_at timestamptz not null default now()
);

insert into desk_settings (id) values (1) on conflict (id) do nothing;

create table if not exists universe_assets (
  symbol text primary key,
  base text not null,
  name text not null,
  market_cap_usd double precision not null,
  volume_24h_usd double precision not null default 0,
  max_leverage integer not null default 25,
  listed_lighter integer not null default 1,
  listed_aster integer not null default 1,
  listed_toobit integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists signals (
  id serial primary key,
  ts timestamptz not null default now(),
  bar_time bigint not null default 0,
  symbol text not null,
  timeframe text not null,
  indicator text not null,
  side text not null,
  entry double precision not null,
  sl double precision not null,
  tp double precision not null,
  rr double precision not null,
  atr double precision,
  reason text,
  taken integer not null default 0,
  skip_reason text
);
create index if not exists signals_ts_idx on signals (ts desc);
create index if not exists signals_sym_idx on signals (symbol, timeframe);

create table if not exists positions (
  id serial primary key,
  mode text not null,
  venue text not null,
  symbol text not null,
  timeframe text not null,
  indicator text not null,
  side text not null,
  entry double precision not null,
  sl double precision not null,
  tp double precision not null,
  qty double precision not null,
  leverage integer not null,
  notional_usd double precision not null,
  risk_usd double precision not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  exit_px double precision,
  exit_reason text,
  pnl_usd double precision,
  pnl_r double precision,
  fees_usd double precision not null default 0,
  status text not null default 'open',
  exchange_order_id text
);
create index if not exists positions_status_idx on positions (status, opened_at desc);

create table if not exists equity_snapshots (
  id serial primary key,
  ts timestamptz not null default now(),
  equity_usd double precision not null,
  open_count integer not null default 0,
  mode text not null
);
create index if not exists equity_ts_idx on equity_snapshots (ts desc);

create table if not exists scan_log (
  id serial primary key,
  ts timestamptz not null default now(),
  scanned integer not null,
  signals integer not null,
  opened integer not null,
  closed integer not null,
  duration_ms integer not null,
  note text
);

create table if not exists backtests (
  id serial primary key,
  created_at timestamptz not null default now(),
  symbol text not null,
  timeframe text not null,
  indicator text not null,
  bars integer not null,
  trades integer not null,
  wins integer not null,
  losses integer not null,
  win_rate double precision not null,
  profit_factor double precision not null,
  expect_r double precision not null,
  net_r double precision not null,
  max_dd_r double precision not null,
  result_json text not null
);
