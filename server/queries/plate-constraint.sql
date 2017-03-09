-- every image should have only one plate color
select "base",count(*) from image as im, image_tag as it
where im.base = it.image_id
and (it.tag_id = 'blue' or it.tag_id = 'white' or it.tag_id = 'gray')
group by 1 order by 2 desc
;
