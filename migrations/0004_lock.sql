-- Operator PIN lock. Mutations and secrets require an unlocked session cookie.
alter table desk_settings add column if not exists operator_pin_hash text;
alter table desk_settings add column if not exists operator_pin_salt text;
alter table desk_settings add column if not exists operator_session text;
