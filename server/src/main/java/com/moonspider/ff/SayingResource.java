package com.moonspider.ff;

import com.codahale.metrics.annotation.Timed;
import com.moonspider.ff.model.Saying;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

@Path("/hello-world")
@Produces(MediaType.APPLICATION_JSON)
public class SayingResource {

    public SayingResource(String defaultName) {
        this.defaultName = defaultName;
        counter = new AtomicLong();
    }
    private String defaultName;
    private AtomicLong counter;
    private final String format = "Hello %s!";

    @GET
    @Timed
    public Saying sayHello(@QueryParam("name") Optional<String> name) {
        return new Saying(counter.incrementAndGet(), String.format(format, name.orElse(defaultName)));
    }
}
