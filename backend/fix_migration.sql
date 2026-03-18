-- Fix script to manually resolve migration state
-- Run this if the migration is partially applied

-- Check current state
SELECT CONSTRAINT_NAME, TABLE_NAME 
FROM information_schema.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('Review', 'User', 'Series', 'Favorite')
AND CONSTRAINT_TYPE = 'FOREIGN KEY';

-- If foreign keys exist, drop them
-- (Uncomment these if they exist)
-- ALTER TABLE Review DROP FOREIGN KEY Review_seriesId_fkey;
-- ALTER TABLE Review DROP FOREIGN KEY Review_userId_fkey;
