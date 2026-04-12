-- Migrate old class values to new 8-class system
UPDATE "Character" SET "class" = 'warrior' WHERE "class" = 'paladin';
UPDATE "Character" SET "class" = 'ranger' WHERE "class" = 'rogue';
UPDATE "Character" SET "class" = 'artificer' WHERE "class" = 'artist';
