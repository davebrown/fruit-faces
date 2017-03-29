-- select round_minutes(tstamp, 5, 'HH24:MI'), count(*) from image where date_part('hour', tstamp) >= 5 and date_part('hour', tstamp) <= 10 group by 1 order by 1 asc;

/* select * from generate_series(0,10,2); */

-- select MOD(cast(extract(epoch from tstamp) as integer), 60 * 60) from image;

-- select histogram(cast (date_part('minute', tstamp) as real), 0.0, 59.0, 60) from image;

/*
select cast(60*h + m as real) as minute from (
  select date_part('hour', tstamp) as h, date_part('minute', tstamp) as m from image
) as abs_minute where h >= 4 and h <= 10;
*/

/*
select histogram(cast((5 * minute) / 5 as real), 5 * 60.0, 10 * 60.0, 73) from
(select cast(60*h + m as real) as minute from (
  select date_part('hour', tstamp) as h, date_part('minute', tstamp) as m from image
) as abs_minute where h >= 5 and h <= 10) as abs_minute2;
*/

/*
select minute, histogram(minute, 5 * 60.0, 10 * 60.0, 73) from
(select cast(60*h + m as real) as minute from (
  select date_part('hour', tstamp) as h, date_part('minute', tstamp) as m from image
) as abs_minute where h >= 5 and h <= 10) as abs_minute2 group by minute order by minute;
*/

-- select generate_series(60*5, 60*10, 5);
drop view morning_minute;

CREATE OR REPLACE VIEW morning_minute as
select 60*h + m as abs_minute, ((60*h + m) / 5) * 5 as abs_minute_round, dow, year from (
  select
    cast(date_part('hour', tstamp) as integer) as h,
    cast(date_part('minute', tstamp) as integer) as m,
    date_part('dow', tstamp) as dow,
    date_part('year', tstamp) as year
  from image
) as abs_minute where h >= 4 and h <= 10;

--select abs_minute_round, count(*) from morning_minute
--LEFT JOIN morning_minute group by abs_minute_round;
