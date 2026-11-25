# Performance notes (Week 9, Part B)

Measurements taken against the local development database:

| | |
| --- | --- |
| MySQL | 8.4.11, InnoDB |
| Rows | 55,212 |
| Table size | ~770 MB — almost all of it `L_Photos`, a longtext column holding a JSON array of image URLs per listing |
| Indexes used | see [backend/sql/indexes.sql](../backend/sql/indexes.sql) |
| Script | `node backend/scripts/measure-queries.js` |

Wall-clock numbers on a laptop with other work running are noisy, so every timing
below is a median (or minimum) of repeated warm runs and is quoted as an
order of magnitude. The query plans (`type`, `key`, `rows`, `Extra`) are stable
and are the stronger evidence.

## Reading EXPLAIN

`EXPLAIN` describes how MySQL intends to run one `SELECT`, without running it.
The version this project uses prints one row per table accessed.

| Column | Meaning |
| --- | --- |
| `id` | Query block number. `1` for a simple query; higher numbers are subqueries or unions. |
| `select_type` | `SIMPLE` (no subquery/union), `PRIMARY`, `SUBQUERY`, `DERIVED`, `UNION`. |
| `table` | The table (or alias/derived table) for this step. |
| `partitions` | Which partitions were considered; `NULL` here because the table is not partitioned. |
| `type` | How rows are found. Best to worst: `system`, `const`, `eq_ref`, `ref`, `range`, `index`, `ALL`. `ref` and `range` mean an index narrowed the search; `index` means a full index scan; `ALL` means a full table scan. |
| `possible_keys` | Indexes that *could* satisfy the WHERE clause. |
| `key` | The index actually chosen; `NULL` means none. |
| `key_len` | Bytes used from the chosen index. A composite index used only partially shows a smaller `key_len` (`83` for the functional `trim(L_Zip)` index). |
| `ref` | The column or constant compared against the index — `const` here, since the filters are bound parameters. |
| `rows` | Estimated rows examined *for this step*. Lower is better, and a large number with a small result is wasted work. |
| `filtered` | Estimated percentage of those rows that pass the remaining conditions. `16.66` means most examined rows are thrown away by the server, i.e. the filter is not covered by the index. |
| `Extra` | Details. `Using index condition` = the storage engine filters rows from the index before fetching them; `Using where` = the server filters after fetching; `Using filesort` = an explicit sort because no index supplied the order; `Using temporary` = an internal temp table; `Backward index scan` = the index was walked in reverse to satisfy a `DESC` sort; `Using MRR` = multi-range read batching. |

## The most complex filter query

The listings endpoint builds this from `GET /api/properties` when every filter is
supplied (city, zip, price range, beds, baths) and the user sorts by price:

```sql
SELECT L_ListingID, L_SystemPrice, L_Photos
FROM rets_property
WHERE LOWER(TRIM(L_City)) = 'irvine'
  AND TRIM(L_Zip) = '92602'
  AND L_SystemPrice >= 500000 AND L_SystemPrice <= 1500000
  AND L_Keyword2 >= 3 AND LM_Dec_3 >= 2
ORDER BY L_SystemPrice DESC, id DESC
LIMIT 20;
```

`EXPLAIN` output:

```
id           1
select_type  SIMPLE
table        rets_property
partitions   NULL
type         ref
possible_keys idx_price, idx_beds_baths, idx_beds, idx_city_norm_price, idx_zip_norm
key          idx_zip_norm
key_len      83
ref          const
rows         82
filtered     0.83
Extra        Using where; Using filesort
```

Interpretation:

- `type: ref` with `key: idx_zip_norm` — MySQL picked the functional index on
  `TRIM(L_Zip)` and narrowed the table to the 82 listings in that ZIP, instead of
  reading all 55,212 rows. Both the city filter and the zip filter are equality
  matches on functional indexes; the optimizer chose the ZIP one, which is fine —
  it is the more selective of the two here.
- `rows: 82` — the estimated work is 82 rows out of 55,212 (about 0.15% of the
  table). This is the number to watch: if it ever approaches the row count, the
  filter is not being used.
- `filtered: 0.83` — after the range/ref access, only ~0.8% of those 82 rows are
  expected to satisfy the price range and the beds/baths minimums. The price
  range is not part of `idx_zip_norm`, so it is applied as a `Using where` filter
  after the rows are fetched. That is cheap at 82 rows and would not be at 50,000.
- `Extra: Using filesort` — no index supplies `L_SystemPrice DESC, id DESC` for
  this access path, so the (≤82) matched rows are sorted in memory. Live result:
  8 rows returned, ~7–28 ms including fetching the `L_Photos` payloads.
- `Using index condition` is absent here because the chosen index holds only one
  column; on the price-only queries below it appears and is what keeps them cheap.

The matching `SELECT COUNT(*)` gets the same plan (`ref`, `idx_zip_norm`,
82 rows, no filesort), so the total printed above the grid costs about as much
as the page itself.

## Common filter combinations

From `node backend/scripts/measure-queries.js` (median of 5 warm runs each):

| Query | type | key | rows examined | Extra | median |
| --- | --- | --- | --- | --- | --- |
| city + price range + beds, `ORDER BY id` | range | `idx_city_norm_price` | 90 | Using where; Using filesort | 18.7 ms |
| city + price range, `ORDER BY price DESC` | range | `idx_city_norm_price` | 708 | Backward index scan | 16.5 ms |
| zip + max price, `ORDER BY id` | ref | `idx_zip_norm` | 247 | Using where | 19.1 ms |
| price range + beds + baths, `ORDER BY price` | range | `idx_price` | 19,102 | Using index condition; Using where | 9.1 ms |
| price range + beds, `ORDER BY price DESC` | range | `idx_price` | 19,102 | Using index condition; Backward index scan; Using MRR | 8.4 ms |
| beds + baths only, `ORDER BY id` | index | `PRIMARY` | 40 | Using where | 28.3 ms |
| count for city + price + beds | range | `idx_city_norm_price` | 90 | Using where | 24.9 ms |

What this says about the two expensive cases:

- **price range + beds/baths** examines ~19,000 rows to return 20 because both
  predicates are ranges: only the price part can drive the index, and
  `filtered: 16.66` shows the server discarding most of what it fetched. It is
  still fast because the rows are fetched from the buffer pool, but it is the
  query most sensitive to a cold cache.
- **beds + baths only, default order** is served by walking the primary key in
  `id` order and stopping after 20 matches (`rows: 40`, no sort at all). That is
  why this shape is cheap even though no filter index is used.

## Index work and what it bought

`rets_property` already had the composites these queries lean on:
`idx_city_norm_price((lower(trim(L_City))), L_SystemPrice)`,
`idx_beds_baths(L_Keyword2, LM_Dec_3)`, `idx_zip_norm((trim(L_Zip)))` and
`idx_price(L_SystemPrice)`.

Added, and measured:

| Index | Why | Result |
| --- | --- | --- |
| `idx_lcd(ListingContractDate)` | "Date listed" sort had no index, so every page was a filesort of whole rows | date sort went from ~10,000 ms to ~5–30 ms |
| `idx_lm_int2_3(LM_Int2_3)` | same for "Square footage" | ~4,400 ms → ~5–35 ms |
| `idx_beds(L_Keyword2)` | `idx_beds_baths` cannot serve `ORDER BY L_Keyword2, id` because `LM_Dec_3` sits between them | beds sort went from ~3,500–117,000 ms to ~10–300 ms |

Combined with the `ORDER BY` tie-break fix (the `id` tie-break now follows the
sort direction so MySQL can use a backward index scan instead of a filesort),
sorted listing requests went from **7–15 s** to **~25 ms** end to end over HTTP.

Tried and not kept:

- `idx_price_beds(L_SystemPrice, L_Keyword2)` — added, `ANALYZE TABLE` run, and
  the optimizer still chose `idx_price` for every price + beds query, because
  `Using index condition` on `idx_price` already pushes the price range into the
  engine and the extra column does not change the access path. An index nothing
  chooses is write cost for no read benefit, so it was dropped.
- `idx_city_beds_price((lower(trim(L_City))), L_Keyword2, L_SystemPrice)` — a
  three-column functional index. It made the "city + price, sorted by price"
  query *worse* (the optimizer switched from a backward index scan to a filesort)
  and took minutes to build on this table, so it was dropped.

One honest caveat found while measuring: for `city + price + beds` with the
default `id` order, forcing the primary-key walk instead of
`idx_city_norm_price` is faster (31 ms versus 262 ms) because the index path
examines 723 rows and sorts them while the primary-key path stops after 40. The
optimizer cannot tell, because it has to guess how many rows will match. Making
the API hint around that would trade a healthy plan for a fragile one, so the
composite is left in place and the trade-off is recorded here.

## Request logging

`backend/src/middleware/requestLogger.js` times each request with
`process.hrtime.bigint()` and logs milliseconds on `finish`:

```
GET /api/properties?sortBy=L_SystemPrice&sortOrder=desc 200 25.03ms
```

It sits before the routers in `backend/src/app.js`, so every route — including
404s and 400s — is timed, and `finish` also fires when a handler errors after
sending headers. `backend/tests/requestLogger.test.js` locks the format down:
200 and 500 responses, unmatched routes, and a deliberately slow handler whose
logged duration has to match the real delay.
