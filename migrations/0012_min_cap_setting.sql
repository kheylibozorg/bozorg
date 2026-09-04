-- Min market cap is a desk setting. 0 = every listed perp on the venue.
alter table desk_settings alter column min_market_cap_usd set default 0;
update desk_settings set min_market_cap_usd = 0 where min_market_cap_usd is null or min_market_cap_usd >= 800000000;
