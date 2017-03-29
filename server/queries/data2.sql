-- http://stackoverflow.com/questions/6195439/postgres-how-do-you-round-a-timestamp-up-or-down-to-the-nearest-minute
CREATE OR REPLACE FUNCTION round_minutes(TIMESTAMP WITHOUT TIME ZONE, integer) 
RETURNS TIMESTAMP WITHOUT TIME ZONE AS $$ 
  SELECT 
     date_trunc('hour', $1) 
     +  cast(($2::varchar||' min') as interval) 
     * round( 
     (date_part('minute',$1)::float + date_part('second',$1)/ 60.)::float 
     / $2::float
      )
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION round_minutes(TIMESTAMP WITHOUT TIME ZONE, integer,text) 
RETURNS text AS $$ 
  SELECT to_char(round_minutes($1,$2),$3)
$$ LANGUAGE SQL IMMUTABLE;

-- https://wiki.postgresql.org/wiki/Aggregate_Histogram

CREATE OR REPLACE FUNCTION hist_sfunc (state INTEGER[], val REAL, MIN REAL, MAX REAL, nbuckets INTEGER) RETURNS INTEGER[] AS $$
DECLARE
  bucket INTEGER;
  i INTEGER;
BEGIN
  -- width_bucket uses nbuckets + 1 (!) and starts at 1.
  bucket := width_bucket(val, MIN, MAX, nbuckets - 1) - 1;
 
  -- Init the array with the correct number of 0's so the caller doesn't see NULLs
  IF state[0] IS NULL THEN
    FOR i IN SELECT * FROM generate_series(0, nbuckets - 1) LOOP
      state[i] := 0;
    END LOOP;
  END IF;
 
  state[bucket] = state[bucket] + 1;
 
  RETURN state;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
 
-- Tell Postgres how to use the new function
DROP AGGREGATE IF EXISTS histogram (REAL, REAL, REAL, INTEGER);
CREATE AGGREGATE histogram (REAL, REAL, REAL, INTEGER) (
       SFUNC = hist_sfunc,
       STYPE = INTEGER[]
);

-- Create a 20 bucket histogram of phases from each host, since the data is in degrees we use 0-360 as the limits.
-- SELECT host, COUNT(*), histogram(phase, 0.0, 360.0, 20) FROM t GROUP BY host ORDER BY host;

