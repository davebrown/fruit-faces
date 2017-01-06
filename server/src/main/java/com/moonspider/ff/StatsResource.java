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
            m.put("x", row[0]);
            m.put("y", row[1]);
            ret.add(m);
        }
        return ret;
    }
}
