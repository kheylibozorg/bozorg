-- 0 = scan the whole universe each tick. Existing 40-coin batches bump to all.
alter table desk_settings alter column scan_batch set default 0;
update desk_settings set scan_batch = 0 where scan_batch <= 40;
