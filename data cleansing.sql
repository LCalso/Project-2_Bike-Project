use misc_db;
select * from bike_share;

select neighborhood,
the_geom,
substring(the_geom,17,17) as LONGITUDE,
substring(the_geom,34,15) as LATITUDE
from bike_share;

SELECT a.NAME,
a.latitude,
a.longitude,
a.CUISINE_TYPE
from 
(select *,
case when name LIKE '%SUSHI%' THEN 'SUSHI' 
when name like '%PIZZA%' THEN 'PIZZA'
when name like '%COFFEE%' THEN 'COFFEE'
when name like '%CAFE%' THEN 'COFFEE'
when name like '%BURGER%' THEN 'BURGERS'
when name like '%TAQUERIA%' THEN 'TAQUERIA'
when name like '%RAMEN%' THEN 'RAMEN'
ELSE 'OTHER' END as CUISINE_TYPE from businesses) a
where CUISINE_TYPE !='OTHER'

