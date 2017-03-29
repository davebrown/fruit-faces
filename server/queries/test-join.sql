SELECT
 to_char(cast('2017-01-13' as timestamp) + S.sm * interval '1 minute', 'HH24:MI') as tod,
 coalesce(MM.count, 0) as count,
 S.sm
FROM
 (select generate_series(5*60,10*60,10) as sm) as S
LEFT JOIN
 (select abs_minute_round, count(abs_minute_round) from morning_minute where dow=2 and year=2016 group by 1) as MM
ON S.sm = MM.abs_minute_round;

