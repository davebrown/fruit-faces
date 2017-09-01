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

--changeset dave:16
alter table image add column original varchar(200);
update image set original = "full";
alter table image alter column original set not null;
alter table image drop column datestr;

--changeset dave:17
alter table image rename column "full" to full_file;

-- changeset dave:18
CREATE TABLE ff_user (
    fb_id varchar(128) PRIMARY KEY NOT NULL UNIQUE,
    email varchar(325),
    name varchar(512)
);

INSERT INTO ff_user (name, email, fb_id) values ('Dave Brown', 'facebook@moonspider.com', '1563589003653025');

ALTER TABLE image ADD COLUMN user_id varchar(128);

UPDATE image set user_id='1563589003653025';

ALTER TABLE image ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE image ADD CONSTRAINT image_user_fkey FOREIGN KEY (user_id) REFERENCES ff_user (fb_id) ON UPDATE NO ACTION ON DELETE CASCADE;

-- changeset dave:19
-- postgres conveniently updates all existing rows appropriately :-)
alter table ff_user add column id serial;

-- changeset dave:20
-- change user pk, and image -> user fk
-- drop image -> user fkey before dropping pkey on user
alter table image drop constraint image_user_fkey;
alter table ff_user drop constraint ff_user_pkey;
alter table ff_user add primary key (id);
-- populate new column on image
alter table image add column user_id2 integer;
update image set user_id2=ff_user.id from ff_user where image.user_id = ff_user.fb_id;
alter table image drop column user_id;
alter table image rename column user_id2 to user_id;
alter table image alter column user_id set not null;
ALTER TABLE image ADD CONSTRAINT image_user_fkey FOREIGN KEY (user_id) REFERENCES ff_user (id) ON UPDATE NO ACTION ON DELETE CASCADE;

-- change the image pk, and image_tag -> image fk
alter table image_tag drop constraint image_tag_image_id_fkey;
alter table image drop constraint image_pkey;
alter table image add column id serial;
alter table image alter column id set not null;
alter table image add primary key (id);

alter table image_tag add column image_id2 integer;
update image_tag set image_id2=image.id from image where image.base = image_tag.image_id;
alter table image_tag drop column image_id;
alter table image_tag rename column image_id2 to image_id;
alter table image_tag alter column image_id set not null;
alter table image_tag add constraint image_tag_image_id_fkey foreign key (image_id) references image(id) on update no action on delete cascade;
alter table image add unique (user_id, base);

-- changeset dave:21
update image set tstamp=import_time where tstamp is null;

-- changeset dave:22
delete from day_of_week;
insert into day_of_week values (0, 'Sun');
insert into day_of_week values (1, 'Mon');
insert into day_of_week values (2, 'Tue');
insert into day_of_week values (3, 'Wed');
insert into day_of_week values (4, 'Thu');
insert into day_of_week values (5, 'Fri');
insert into day_of_week values (6, 'Sat');

-- changeset dave:23
alter table ff_user add column profile_url varchar(256);
update ff_user set profile_url='https://scontent.xx.fbcdn.net/v/t1.0-1/c94.32.401.401/s50x50/68944_545086002170002_1026279651_n.jpg?oh=08f2f22c127bd8ba71c28df4117900f3&oe=59DD2E9A' where email='facebook@moonspider.com';

-- changeset dave:24
alter table ff_user ADD CONSTRAINT fb_user_id_unique UNIQUE (fb_id);




