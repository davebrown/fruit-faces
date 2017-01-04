create table image (
  base varchar(200) PRIMARY KEY NOT NULL UNIQUE,
  tstamp timestamp,
  dateStr varchar(60),
  "full" varchar(200) NOT NULL
);

create table tag (
  "name" varchar(200) PRIMARY KEY NOT NULL UNIQUE
);

create table image_tag (
  image_id varchar(200) NOT NULL,
  tag_id varchar(200) NOT NULL,
  FOREIGN KEY (image_id) REFERENCES image(base) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tag("name") ON DELETE CASCADE
);

create table day_of_week (
  idx integer NOT NULL UNIQUE,
  name varchar(20) NOT NULL UNIQUE
);

insert into day_of_week values (0, 'Sun');
insert into day_of_week values (1, 'Mon');
insert into day_of_week values (2, 'Tue');
insert into day_of_week values (3, 'Wed');
insert into day_of_week values (4, 'Thu');
insert into day_of_week values (5, 'Fri');
insert into day_of_week values (6, 'Sat');

CREATE INDEX image_base_idx ON image(base);
CREATE INDEX tag_idx ON tag("name");
CREATE INDEX join_image_idx ON image_tag(image_id);
CREATE INDEX join_tag_idx ON image_tag(tag_id);
CREATE UNIQUE INDEX it_unique_idx ON image_tag (image_id, tag_id);
