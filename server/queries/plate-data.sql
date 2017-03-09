copy (select "full",tag_id from image as im, image_tag as it
where im.base = it.image_id
and (it.tag_id = 'blue' or it.tag_id = 'white' or it.tag_id = 'gray')
order by "full")

to '/tmp/trained-plates.csv' (format CSV)
;
