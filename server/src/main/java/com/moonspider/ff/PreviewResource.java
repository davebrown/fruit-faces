package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.ImageEJB;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.ws.rs.*;
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
    @Path("/{userId}/{baseName}")
    @Timed
    @UnitOfWork(transactional = false)
    public Response preview(@HeaderParam("Host") String serverHost, @PathParam("userId") int userId, @PathParam("baseName") String base) {
        return preview(serverHost, userId, base, "Art for Breakfast");
    }
    @GET
    @Path("/{userId}/{baseName}/{title}")
    @Timed
    @UnitOfWork(transactional = false)
    public Response preview(@HeaderParam("Host") String serverHost, @PathParam("userId") int userId, @PathParam("baseName") String base, @PathParam("title") String title) {
        String prefix = config.getAssetUrlPrefix();
        log.info("running " + userId + " / " + base);
        StringBuilder sb = new StringBuilder();
        sb.append("<html><head>");
        ImageEJB ejb = findEJB(userId, base);
        String to, description, imageUrl, thisUrl;
        imageUrl = config.getAssetUrlPrefix() + "/thumbs/" + userId + "/" + ejb.getFull();
        thisUrl = config.getAssetUrlPrefix() + "/images/" + userId + "/" + ejb.getBase();
        if (ejb != null) {
            to = prefix + "/images/" + userId + "/" + base;
            description = ejb.getUser().getName() + " shared a fun, nutritious and delicious fruit face on Art for Breakfast.";
        } else {
            to = prefix + "/";
            description = "Art for Breakfast is a fun way to share nutritious and delicious fruit art for kids";
        }

        sb.append("  <link type=\"text/css\" rel=\"stylesheet\" href=\"" + prefix + "/css/spectre.min.css\"/>\n" +
                "  <link type=\"text/css\" rel=\"stylesheet\" href=\"" + prefix + "/css/ff.css\"/>\n" +
                "<meta property=\"fb:app_id\" content=\"" + config.getFbAppId() + "\"/>\n" +
                "<meta property=\"og:title\" content=\"" + title + "\"/>\n" +
                "<meta property=\"og:description\" content=\"" + description + "\"/>\n" +
                "<meta property=\"og:image\" content=\"" + imageUrl + "\"/>\n" +
                "<meta property=\"og:url\" content=\"" + thisUrl + "\"/>\n" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n");
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
        sb.append("<p><a href=\"" + to + "\"><img src=\"" + imageUrl + "\"/></a></p>\n");
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
