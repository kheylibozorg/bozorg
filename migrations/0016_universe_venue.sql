-- Tag the stored book with the venue it was loaded from, plus the native pair name.
alter table desk_settings add column if not exists universe_venue text;
alter table universe_assets add column if not exists venue_symbol text;
