-- every image should have only one plate color
select "base",count(*) from image as im, image_tag as it
where im.base = it.image_id
group by 1 order by 2 desc
;
