package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonspider.ff.model.PingDTO;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.moonspider.ff.model.PingDTO.ResourceStatus.*;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import static com.moonspider.ff.Util.close;


@Path("/api/v1")
@Produces(MediaType.APPLICATION_JSON)
public class InfoResource extends BaseResource {

    public static final Map<String,String> BUILD_INFO = loadBuildInfo();
    private static final Logger log = LoggerFactory.getLogger(InfoResource.class);


    public InfoResource(EntityManager entityManager, FFConfiguration config) {
        super(entityManager, config);
    }

    private static Map<String,String> loadBuildInfo() {
        Map<String,String> ret;
        ObjectMapper mapper = new ObjectMapper();
        InputStream inputStream = InfoResource.class.getResourceAsStream("/build-info.json");
        if (inputStream != null) {
            try {
                ret = mapper.readValue(inputStream, Map.class);
            } catch (IOException ioe) {
                throw new Error(ioe);
            } finally {
                close(inputStream);
            }
        } else {
            throw new Error("resource /build-info.json not found");
        }
        return ret;
    }


    @GET
    @Path("/build")
    public Map<String,String> getBuild() {
        return BUILD_INFO;
    }

    @GET
    @Path("/build/revision")
    public String getBuildRevision() {
        return BUILD_INFO.get("revision");
    }

    @GET
    @Path("/build/timestamp")
    public String getBuildTimestamp() {
        return BUILD_INFO.get("build_timestamp");
    }

    @GET
    @Path("/ping")
    @Timed
    @UnitOfWork(transactional = false)
    public PingDTO ping() {
        return new PingDTO()
        .addResource(checkPostgres())
        ;
    }

    @GET
    @Path("/401")
    public String do401() {
        throw new WebApplicationException("you need auth", 401);
    }

    private PingDTO.Resource checkPostgres() {
        PingDTO.Resource ret;
        try {
            Query query = entityManager.createNativeQuery("SELECT * FROM IMAGE WHERE 1=0");
            List l = query.getResultList();
            ret = new PingDTO.Resource("postgresql", OK);
        } catch (Exception problem) {
            Throwable root = Util.unwindExceptions(problem);
            log.error("postgres problem", problem);
            ret = new PingDTO.Resource("postgresql", ERROR, root.toString());
        }
        return ret;
    }
}
