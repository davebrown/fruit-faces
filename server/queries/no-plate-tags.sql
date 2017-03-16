copy (
 select "full" from image where base NOT IN (select image_id from image_tag where tag_id in ('blue', 'gray', 'white'))
)

to '/tmp/test-plates.csv' (format CSV);

-- select "full",coalesce(tag_id,null) from image as im, image_tag as it
-- where im.base = it.image_id
-- and (it.tag_id = 'blue' or it.tag_id = 'white' or it.tag_id = 'gray')
-- order by "full"
-- ;
