package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.ImageEJB;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/api/v1/preview")
@Produces(MediaType.TEXT_HTML)
public class PreviewResource extends BaseResource {

    private static final Logger log = LoggerFactory.getLogger(PreviewResource.class);

    public PreviewResource(EntityManager entityManager, FFConfiguration config) {
        super(entityManager, config);
    }

    // 'ignore' is for FB UI
    @GET
    @Path("/{userId}/{baseName}/{ignore}")
    @Timed
    @UnitOfWork(transactional = false)
    public Response preview(@PathParam("userId") int userId, @PathParam("baseName") String base, @PathParam("ignore") String ignore) {
        return preview(userId, base);
    }
    @GET
    @Path("/{userId}/{baseName}")
    @Timed
    @UnitOfWork(transactional = false)
    public Response preview(@PathParam("userId") int userId, @PathParam("baseName") String base) {
        String prefix = config.getAssetUrlPrefix();
        log.info("running " + userId + " / " + base);
        StringBuilder sb = new StringBuilder();
        sb.append("<html><head>");
        ImageEJB ejb = findEJB(userId, base);
        String to = ejb != null ? prefix + "/#/images/" + userId + "/" + base : prefix + "/";
        sb.append("  <link type=\"text/css\" rel=\"stylesheet\" href=\"" + prefix + "/css/spectre.min.css\"/>\n" +
                        "  <link type=\"text/css\" rel=\"stylesheet\" href=\"" + prefix + "/css/ff.css\"/>\n" +
                        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n");
        sb.append("<script language=\"javascript\" type=\"text/javascript\"> setTimeout(function() { window.location = '" + to + "'; }, 8888);</script>");
        if (ejb == null) {
            sb.append("<title>/" + userId + "/" + base + " not found</title>");
            sb.append("<body><p>/" + userId + "/" + base + " not found</p>");
            sb.append("<p>Why not browse some <a href=\"" + to + "\">other fruit faces?</a></p></body></html>");
            return Response.status(404).entity(sb.toString()).build();
        }
        sb.append("<title>");
        sb.append(base);
        sb.append("</title></head><body>");
        sb.append("<p><a href=\"" + to + "\"><img src=\"" + prefix + "/thumbs/" + userId + "/" + ejb.getFull() + "\"/></a></p>\n");
        sb.append("<p>" + ejb.getUser().getName() + "&apos;s fruit face. See more <a href=\"" + to + "\">here</a>.</p>");
        sb.append("</body></html>\n");
        return Response.ok(sb.toString()).build();
    }

    private ImageEJB findEJB(int userId, String base) {
        Query q = entityManager.createQuery("select i from ImageEJB i where i.userId=:userId and i.base=:base");
        q.setParameter("userId", userId);
        q.setParameter("base", base);
        return getSingleResult(q, ImageEJB.class);

    }
}
