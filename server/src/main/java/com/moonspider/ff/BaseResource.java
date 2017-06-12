package com.moonspider.ff;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.moonspider.ff.client.FBService;
import com.moonspider.ff.ejb.UserEJB;
import com.moonspider.ff.model.UserDTO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import retrofit2.Retrofit;
import retrofit2.converter.jackson.JacksonConverterFactory;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import java.util.List;
import java.util.concurrent.TimeUnit;

public abstract class BaseResource {

    private static final Logger log = LoggerFactory.getLogger(BaseResource.class);

    private static final Cache<String,UserDTO> USER_CACHE = CacheBuilder.newBuilder()
            .initialCapacity(100)
            .maximumSize(10 * 1000)
            .concurrencyLevel(100)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .build();

    private static Retrofit retrofit = new Retrofit.Builder()
            .baseUrl("https://graph.facebook.com/")
            .addConverterFactory(JacksonConverterFactory.create(Util.JSON))
            .build();

    private static FBService fb = retrofit.create(FBService.class);

    protected EntityManager entityManager;
    protected  FFConfiguration config;
    protected BaseResource(EntityManager em, FFConfiguration config) {
        this.entityManager = em;
        this.config = config;
    }

    protected <T> T getSingleResult(Query query, Class<T> c) {
        List l = query.getResultList();
        if (l.size() > 1) {
            String msg = "query '" + query.toString() + "' expected 1 or zero, got " + l.size();
            log.error(msg);
            throw new RuntimeException(msg);
        }
        return l.size() == 0 ? null : (T)l.get(0);
    }

    protected void checkAuth(UserEJB operator, UserEJB owner) {
        if (operator == null) {
            throw new WebApplicationException("authentication required", 401);
        } else if (config.getRootUserId() == operator.getId()) {
            // allow, just log
            log.info("allowing root access to object owned by " + owner.getEmail());
        } else if (owner.getId() != operator.getId()) {
            throw new WebApplicationException("not owner of resource", 403);
        }
    }

    private UserDTO user(final String accessToken) {
        if (accessToken == null || "null".equals(accessToken))
            return null;
        try {
            UserDTO ret = USER_CACHE.get(accessToken, () -> {
                retrofit2.Response<UserDTO> response = fb.me(accessToken).execute();
                if (response.isSuccessful()) {
                    return response.body();
                }
                // FIXME: make smarter return code?
                // FIXME: ok to log this?
                log.warn("response for token '" + accessToken + "' msg=" + response.message());
                throw new WebApplicationException(response.message(), 401);
            });
            return ret;
        } catch (/*Execution*/Exception e) { /* ExecutionException || UncheckExecutionException */
            log.error("Exception calling FB API", e);
            log.error("FB root", Util.unwindExceptions(e));
            throw new WebApplicationException("internal server error", 500);
        }
    }

    private UserEJB findUser(UserDTO dto) {
        Query query = entityManager.createQuery("SELECT u from UserEJB u where u.email=:email and u.fbId=:fbId");
        query.setParameter("email", dto.getEmail());
        query.setParameter("fbId", dto.getFbId());
        UserEJB ejb = getSingleResult(query, UserEJB.class);
        return ejb;
    }
    // caller method must have @UnitOfWork(transactional = true)
    // since this might write to DB. But should be true that caller is so annotated anyway
    // at least until app ever imposes auth on read operations
    private UserEJB findOrCreateUser(UserDTO dto) {
        UserEJB ejb = findUser(dto);
        if (ejb == null) {
            ejb = new UserEJB();
            ejb.setFbId(dto.getFbId());
            ejb.setEmail(dto.getEmail());
            ejb.setName(dto.getName());
            ejb.setProfileUrl(dto.getProfileUrl());
            entityManager.persist(ejb);
        }
        return ejb;
    }

    protected UserEJB findOrCreateUser(String accessToken) {
        UserDTO user;
        try {
            user = user(accessToken);
        } catch (Exception e) {
            log.error("could not lookup user", e);
            return null;
        }
        if (user == null) {
            return null;
        }
        return findOrCreateUser(user);
    }
    public static class JsonError {
        @JsonProperty
        public String message;
        @JsonProperty
        public int code;
        @JsonProperty
        public int statusCode;

        public JsonError(String msg) {
            message = msg;
        }
        public JsonError code(int c) {
            this.code = this.statusCode = c;
            return this;
        }
    }


    protected static JsonError errBody(String msg) {
        return new JsonError(msg);
    }

    protected static Response error(int code, String errMsg) {
        return Response.status(code).entity(errBody(errMsg).code(code)).build();
    }
    protected static Response _400(String errMsg) {
        return error(400, errMsg);
    }
}
