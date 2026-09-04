-- Hyperliquid agent wallet + Lighter API key index
alter table desk_settings add column if not exists hyperliquid_private_key text;
alter table desk_settings add column if not exists hyperliquid_wallet_address text;
alter table desk_settings add column if not exists lighter_api_key_index integer;
