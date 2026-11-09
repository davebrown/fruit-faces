package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.TagEJB;
import com.moonspider.ff.model.ImageDTO;

import io.dropwizard.hibernate.UnitOfWork;
import io.dropwizard.hibernate.UnitOfWork;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import jakarta.persistence.TypedQuery;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Path("/api/v1/tags")
@Produces(MediaType.APPLICATION_JSON)
public class TagResource extends BaseResource {

    public TagResource(SessionFactory sessionFactory, FFConfiguration configuration) {
        super(sessionFactory, configuration);
    }

    private static Collection<String> COLOR_TAGS = new ArrayList();
    static {
        COLOR_TAGS.add("blue");
        COLOR_TAGS.add("white");
        COLOR_TAGS.add("gray");
    };

    @GET
    @Path("/colors")
    @UnitOfWork(transactional = false)
    public Collection<String> getColors() {
        TypedQuery<TagEJB> query = getEntityManager().createQuery(
                "SELECT t FROM TagEJB t WHERE t.name IN (:color_tags)",
                TagEJB.class);
        query.setParameter("color_tags", COLOR_TAGS);
        return toStrings(query);
    }

    @GET
    @Path("/non-colors")
    @UnitOfWork(transactional = false)
    public Collection<String> getNonColors() {
        TypedQuery<TagEJB> query = getEntityManager().createQuery(
                "SELECT t FROM TagEJB t WHERE t.name NOT IN (:color_tags)",
                TagEJB.class);
        query.setParameter("color_tags", COLOR_TAGS);
        return toStrings(query);
    }


    @GET
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<String> getAll() {
        TypedQuery<TagEJB> query = getEntityManager().createQuery("SELECT t FROM TagEJB t", TagEJB.class);
        return toStrings(query);
    }

    private Collection<String> toStrings(TypedQuery<TagEJB> query) {
        List<TagEJB> dbList = query.getResultList();
        List<String> dtoList = new ArrayList<>(dbList.size());
        dbList.forEach(ejb->dtoList.add(ejb.getName()));
        return dtoList;
    }
}
