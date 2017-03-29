-- year, dow
-- dow, sunday is 0
/*
select name, count from (
select dow.name as "name", count(*) as "count", dow.idx
from image as img, day_of_week as dow
where date_part('dow', img.tstamp) = dow.idx
group by 1,3 order by 3) AS count_by_day;
*/

select month, count from (
  select to_char(date_trunc('month', tstamp), 'Mon/YYYY') as month,
  count(*) as count, date_trunc('month', tstamp)
  from image group by 3 order by 3
) as month_and_count;



