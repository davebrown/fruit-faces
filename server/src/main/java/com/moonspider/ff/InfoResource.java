package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.model.ImageDTO;
import com.moonspider.ff.model.PingDTO;
import com.scottescue.dropwizard.entitymanager.UnitOfWork;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.moonspider.ff.model.PingDTO.ResourceStatus.*;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Query;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import static com.moonspider.ff.Util.close;


@Path("/api/v1/info")
@Produces(MediaType.APPLICATION_JSON)
public class InfoResource {

    private static final Map<String,String> BUILD_INFO = loadBuildInfo();
    private static final Logger log = LoggerFactory.getLogger(InfoResource.class);

    private EntityManager entityManager;
    public InfoResource(EntityManager entityManager) {
        this.entityManager = entityManager;
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
    public Map<String,String> getBuildInfo() {
        return BUILD_INFO;
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
