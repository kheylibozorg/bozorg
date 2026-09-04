-- Neon tables created from an earlier SQL paste have `size NOT NULL` while the
-- app writes `qty`. Keep both in sync and give `size` a default so inserts never
-- die on a null constraint.
alter table positions add column if not exists qty double precision;
alter table positions add column if not exists size double precision;
alter table positions add column if not exists mode text;
alter table positions add column if not exists venue text;
alter table positions add column if not exists notional_usd double precision;
alter table positions add column if not exists risk_usd double precision;
alter table positions add column if not exists fees_usd double precision;
alter table positions add column if not exists exit_px double precision;
alter table positions add column if not exists exit_reason text;
alter table positions add column if not exists pnl_usd double precision;
alter table positions add column if not exists pnl_r double precision;
alter table positions add column if not exists status text;
alter table positions add column if not exists exchange_order_id text;
alter table positions add column if not exists opened_at timestamptz;
alter table positions add column if not exists closed_at timestamptz;
alter table positions add column if not exists leverage double precision;

update positions set qty = size where qty is null and size is not null;
update positions set size = qty where size is null and qty is not null;
update positions set qty = 0 where qty is null;
update positions set size = 0 where size is null;
update positions set mode = coalesce(mode, 'paper');
update positions set venue = coalesce(venue, 'paper');
update positions set status = coalesce(status, 'open');
update positions set fees_usd = coalesce(fees_usd, 0);
update positions set notional_usd = coalesce(notional_usd, 0);
update positions set risk_usd = coalesce(risk_usd, 0);
update positions set leverage = coalesce(leverage, 1);
update positions set opened_at = coalesce(opened_at, now());

alter table positions alter column qty set default 0;
alter table positions alter column size set default 0;
alter table positions alter column fees_usd set default 0;
alter table positions alter column notional_usd set default 0;
alter table positions alter column risk_usd set default 0;
alter table positions alter column leverage set default 1;
alter table positions alter column mode set default 'paper';
alter table positions alter column venue set default 'paper';
alter table positions alter column status set default 'open';
alter table positions alter column opened_at set default now();
