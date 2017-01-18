--liquibase formatted sql

--changeset dave:1484767143415-1
CREATE TABLE day_of_week (idx INT NOT NULL, name VARCHAR(20) NOT NULL);

--changeset dave:1484767143415-2
CREATE TABLE image (base VARCHAR(200) NOT NULL, tstamp TIMESTAMP WITHOUT TIME ZONE, datestr VARCHAR(60), "full" VARCHAR(200) NOT NULL, import_time TIMESTAMP WITHOUT TIME ZONE);

--changeset dave:1484767143415-3
CREATE TABLE image_tag (image_id VARCHAR(200) NOT NULL, tag_id VARCHAR(200) NOT NULL);

--changeset dave:1484767143415-4
CREATE TABLE tag (name VARCHAR(200) NOT NULL);

--changeset dave:1484767143415-5
ALTER TABLE image ADD CONSTRAINT image_pkey PRIMARY KEY (base);

--changeset dave:1484767143415-6
ALTER TABLE tag ADD CONSTRAINT tag_pkey PRIMARY KEY (name);

--changeset dave:1484767143415-7
ALTER TABLE day_of_week ADD CONSTRAINT day_of_week_idx_key UNIQUE (idx);

--changeset dave:1484767143415-8
ALTER TABLE day_of_week ADD CONSTRAINT day_of_week_name_key UNIQUE (name);

--changeset dave:1484767143415-9
CREATE UNIQUE INDEX it_unique_idx ON image_tag(image_id, tag_id);

--changeset dave:1484767143415-10
CREATE INDEX join_image_idx ON image_tag(image_id);

--changeset dave:1484767143415-11
CREATE INDEX join_tag_idx ON image_tag(tag_id);

--changeset dave:1484767143415-12
ALTER TABLE image_tag ADD CONSTRAINT image_tag_image_id_fkey FOREIGN KEY (image_id) REFERENCES image (base) ON UPDATE NO ACTION ON DELETE CASCADE;

--changeset dave:1484767143415-13
ALTER TABLE image_tag ADD CONSTRAINT image_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tag (name) ON UPDATE NO ACTION ON DELETE CASCADE;

--changeset dave:14
CREATE VIEW morning_minute AS  SELECT ((60 * abs_minute.h) + abs_minute.m) AS abs_minute,
    ((((60 * abs_minute.h) + abs_minute.m) / 5) * 5) AS abs_minute_round,
    abs_minute.dow,
    abs_minute.year
   FROM ( SELECT (date_part('hour'::text, image.tstamp))::integer AS h,
            (date_part('minute'::text, image.tstamp))::integer AS m,
            date_part('dow'::text, image.tstamp) AS dow,
            date_part('year'::text, image.tstamp) AS year
           FROM image) abs_minute
  WHERE ((abs_minute.h >= 4) AND (abs_minute.h <= 10));;

--changeset dave:15
update image set import_time='2017-01-01 00:00:00' where import_time is null;
alter table image alter column import_time set not null;

