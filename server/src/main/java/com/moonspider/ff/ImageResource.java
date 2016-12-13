package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.model.ImageDTO;
import com.moonspider.ff.model.Saying;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Path("/images")
@Produces(MediaType.APPLICATION_JSON)
public class ImageResource {

    private final EntityManager entityManager;
    public ImageResource(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @GET
    @Timed
    @UnitOfWork(transactional = false)
    public ImageDTO getImage(@QueryParam("base") String base) {
        p("running '" + base + "'");
        ImageDTO ret = null;
        //Query query = entityManager.createQuery("", ImageEJB.class);
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        p("found: " + ejb);
        ret = new ImageDTO(ejb.getBase(), ejb.getTstamp().getTime(), ejb.getFull(), ejb.getDatestr());
        p("returning: " + ret);
        return ret;
    }

    private static void p(String s) {
        System.out.println("[ImgResource] " + s);
    }

}
