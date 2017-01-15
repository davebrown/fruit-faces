package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.*;

@Path("/api/v1/stats")
@Produces(MediaType.APPLICATION_JSON)
public class StatsResource {

    private final EntityManager entityManager;
    public StatsResource(EntityManager entityManager) {
        this.entityManager = entityManager;
    }


    @GET
    @Path("/day-of-week")
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<Map> getCountByDayOfWeek() {
        Query query = entityManager.createNativeQuery(
                "SELECT name, count FROM (" +
                        "select dow.name, count(*), dow.idx\n" +
                        "from image as img, day_of_week as dow\n" +
                        "where date_part('dow', img.tstamp) = dow.idx\n" +
                        "group by 1,3 order by 3) AS count_by_name;"
        );
        List<Object[]> data = query.getResultList();
        List<Map> ret = new ArrayList();
        for (Object[] row : data) {
            Map m = new HashMap();
            m.put("day", row[0]);
            m.put("count", row[1]);
            ret.add(m);
        }
        return ret;
    }

    //  [{"x":"Feb 2014","y":12, label: 'Feb \'14: 12 faces'}
    @GET
    @Path("/by-month")
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<Map> getByMonth() {
        Query query = entityManager.createNativeQuery(
                "select month, count from (\n" +
                        "  select to_char(date_trunc('month', tstamp), 'Mon \"''\"YY') as month,\n" +
                        "  count(*) as count, date_trunc('month', tstamp)\n" +
                        "  from image group by 3 order by 3\n" +
                        ") as month_and_count;"
        );
        List<Object[]> data = query.getResultList();
        List<Map> ret = new ArrayList();
        for (Object[] row : data) {
            Map m = new HashMap();
            m.put("x", row[0]);
            m.put("y", row[1]);
            m.put("label", row[0] + " faces: " + row[1]);
            ret.add(m);
        }
        return ret;
    }

    @GET
    @Path("/time-of-day")
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<Map> getByTimeOfDay() {
        Query query = entityManager.createNativeQuery(
                "SELECT\n" +
                        " to_char(cast('2017-01-13' as timestamp) + S.sm * interval '1 minute', 'HH24:MI') as tod,\n" +
                        " coalesce(MM.count, 0) as count,\n" +
                        " S.sm\n" +
                        "FROM\n" +
                        " (select generate_series(5*60,10*60,10) as sm) as S\n" +
                        "LEFT JOIN\n" +
                        " (select abs_minute_round, count(abs_minute_round) from morning_minute group by 1) as MM\n" +
                        "ON S.sm = MM.abs_minute_round;"
        );
        List<Object[]> data = query.getResultList();
        List<Map> ret = new ArrayList();
        for (Object[] row : data) {
            Map m = new HashMap();
            m.put("time", row[0]);
            m.put("count", row[1]);
            m.put("label", row[0] + " faces: " + row[1]);
            ret.add(m);
        }
        return ret;
    }

}
