package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.ejb.TagEJB;
import com.moonspider.ff.model.ImageDTO;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
//import org.slf4j.LoggerFactory;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Path("/api/v1/images")
@Produces(MediaType.APPLICATION_JSON)
public class ImageResource {

    private final Logger log = LoggerFactory.getLogger(ImageResource.class);

    private final EntityManager entityManager;
    private final FFConfiguration config;
    public ImageResource(EntityManager entityManager, FFConfiguration config) {
        this.entityManager = entityManager;
        this.config = config;
    }

    @GET
    @Timed
    @UnitOfWork(transactional = false)
    public Collection<ImageDTO> getAll() {
        //TypedQuery<ImageEJB> query = entityManager.createQuery("SELECT i FROM ImageEJB i ORDER BY random()", ImageEJB.class);
        TypedQuery<ImageEJB> query = entityManager.createQuery("SELECT i FROM ImageEJB i ORDER BY i.tstamp DESC", ImageEJB.class);
        List<ImageEJB> dbList = query.getResultList();
        List<ImageDTO> dtoList = new ArrayList<>(dbList.size());
        dbList.forEach(ejb->dtoList.add(new ImageDTO(ejb)));
        return dtoList;
    }

    // http://stackoverflow.com/questions/29109887/how-can-i-return-404-http-status-from-dropwizard
    @GET
    @Path("/{id}")
    @Timed
    @UnitOfWork(transactional = false)
    public Optional<ImageDTO> getImage(@PathParam("id") String base) {
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            return Optional.empty();
        }
        return Optional.of(new ImageDTO(ejb));
    }

    /* FIXME: this bulk update endpoint has concurrency problems.
       Remove in favor or per-tag PUT/DELETE.
      */
    @PUT
    @Path("/{id}/tags")
    @UnitOfWork(transactional = true)
    public void updateTags(@PathParam("id") String base, Collection<String> tags) {
        log.info("received tag update: /" + base + " " + tags);
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag operation when disallowed!");
            throw new WebApplicationException(401);
        }
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            log.warn("image not found: " + base);
            throw new WebApplicationException(404);
        }
        List<TagEJB> tagEJBs = new ArrayList<>();
        for (String tag : tags) {
            TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
            if (tagEJB == null) {
                log.warn("tag not found: " + tag);
                throw new WebApplicationException(404);
            }
            tagEJBs.add(tagEJB);
        }
        ejb.setTagList(tagEJBs);
        entityManager.persist(ejb);
    }

    /** associate tag with this image */
    @POST
    @Path("/{id}/tags/{tag}")
    @UnitOfWork(transactional = true)
    public void addTag(@PathParam("id") String base, @PathParam("tag") String tag) {
        log.info("received tag POST: /" + base + " " + tag);
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag operation when disallowed!");
            throw new WebApplicationException(401);
        }
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            throw new WebApplicationException(404);
        }
        TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
        if (tagEJB == null) {
            /* FIXME: allow create new tags from client? At least need auth */
            tagEJB = new TagEJB(tag);
            entityManager.persist(tagEJB);
        }
        if (!ejb.getTagList().contains(tagEJB)) {
            ejb.getTagList().add(tagEJB);
        }
        entityManager.persist(ejb);
    }

    /** remove tag from this image */
    @DELETE
    @Path("/{id}/tags/{tag}")
    @UnitOfWork(transactional = true)
    public void deleteTag(@PathParam("id") String base, @PathParam("tag") String tag) {
        if (!config.isAllowWriteOperations()) {
            log.warn("attempted tag DELETE when disallowed!");
            throw new WebApplicationException(401);
        }
        ImageEJB ejb = entityManager.find(ImageEJB.class, base);
        if (ejb == null) {
            throw new WebApplicationException(404);
        }
        TagEJB tagEJB = entityManager.find(TagEJB.class, tag);
        if (tagEJB != null) {
            ejb.getTagList().remove(tagEJB);
            entityManager.persist(ejb);
        }
    }

    //private static void p(String s) {
      //  System.out.println("[ImgResource] " + s);
    //}

}
