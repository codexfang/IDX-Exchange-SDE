-- Indexes used by the listings endpoint for Week 9 sorting.
--
-- Run once against the rets database:
--   mysql -u root -p rets < backend/sql/indexes.sql
--
-- Why these exist: rets_property is ~55k rows and every row carries L_Photos,
-- a longtext JSON array, so the table is ~770 MB. Without an index on the sort
-- column, `ORDER BY L_SystemPrice DESC` builds a temporary filesort of whole rows
-- and takes 7-15 seconds. With the column indexed (and the ORDER BY written so
-- the id tie-break matches the sort direction) the same page comes back in ~5ms,
-- because MySQL reads 20 index entries instead of sorting the table.
--
-- Already present and reused: idx_price (L_SystemPrice), idx_beds_baths
-- (L_Keyword2, LM_Dec_3), PRIMARY (id).

-- The existing idx_beds_baths cannot serve `ORDER BY L_Keyword2, id` because
-- LM_Dec_3 sits between the two keys, so beds sorting needs its own index.
CREATE INDEX idx_beds ON rets_property (L_Keyword2);

-- Date listed.
CREATE INDEX idx_lcd ON rets_property (ListingContractDate);

-- Square footage.
CREATE INDEX idx_lm_int2_3 ON rets_property (LM_Int2_3);

-- NOTE: adding an index rebuilds the table, and this table has an `active_check`
-- column whose default is invalid under the server's strict sql_mode, so the
-- ALTER fails with "ER_INVALID_DEFAULT: Invalid default value for
-- 'active_check'". Relax the mode for the session that runs this file:
--
--   SET SESSION sql_mode = '';
