package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.TagEJB;
import com.moonspider.ff.model.ImageDTO;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Path("/tags")
@Produces(MediaType.APPLICATION_JSON)
public class TagResource {

    private final EntityManager entityManager;
    public TagResource(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @GET
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<String> getAll() {
        TypedQuery<TagEJB> query = entityManager.createQuery("SELECT t FROM TagEJB t", TagEJB.class);
        List<TagEJB> dbList = query.getResultList();
        List<String> dtoList = new ArrayList<>(dbList.size());
        dbList.forEach(ejb->dtoList.add(ejb.getName()));
        return dtoList;
    }
}
