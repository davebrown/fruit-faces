package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.ejb.UserEJB;
import com.moonspider.ff.model.UserDTO;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;

@Path("/api/v1/users")
@Produces(MediaType.APPLICATION_JSON)
public class UserResource extends BaseResource {

    private static final Logger log = LoggerFactory.getLogger(UserResource.class);

    public UserResource(EntityManager entityManager, FFConfiguration config) {
        super(entityManager, config);
    }

    @POST
    @Path("/register")
    @Timed
    @UnitOfWork(transactional = true)
    public Response loginHook(@HeaderParam("X-FF-Auth") String accessToken) {
        try {
            UserEJB user = findOrCreateUser(accessToken);
            if (user != null) {
                entityManager.persist(user);
                log.info("user logged in: " + user.getFbId());
                return Response.ok(new UserDTO(user)).build();
            }
            return error(401, "invalid auth token");
        } catch (Exception e) {
            log.error("error looking up user", e);
            // assume expired auth token
            return error(401, "invalid auth token");
        }
    }
    @GET
    @Timed
    @UnitOfWork(transactional = false)
    public Response getAllUsers(@HeaderParam("X-FF-Auth") String authToken) {
        UserEJB user = findOrCreateUser(authToken);
        log.info("check " + user + " against " + config.getRootUserId());
        if (user == null || user.getFbId() == null || user.getId() != config.getRootUserId()) {
            return error(403, "denied");
        }
        TypedQuery<UserEJB> query = entityManager.createQuery("SELECT u FROM UserEJB u", UserEJB.class);
        List<UserEJB> dbList = query.getResultList();
        List ret = new ArrayList();
        dbList.forEach(ejb -> ret.add(new UserDTO(ejb)));
        return Response.ok(ret).build();
    }
}
