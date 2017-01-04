package com.moonspider.ff;

import com.scottescue.dropwizard.entitymanager.EntityManagerBundle;
import com.scottescue.dropwizard.entitymanager.ScanningEntityManagerBundle;
import io.dropwizard.Application;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.eclipse.jetty.servlets.CrossOriginFilter;

import javax.persistence.EntityManager;
import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration;
import java.util.EnumSet;

public class FFApplication extends Application<FFConfiguration> {

    private final EntityManagerBundle<FFConfiguration> entityManagerBundle =
            new ScanningEntityManagerBundle<FFConfiguration>("com.moonspider.ff.ejb") {
                @Override
                public DataSourceFactory getDataSourceFactory(FFConfiguration configuration) {
                    return configuration.getDataSourceFactory();
                }
            };
    @Override
    public void initialize(Bootstrap<FFConfiguration> bootstrap) {
        bootstrap.addBundle(entityManagerBundle);
    }

    @Override
    public void run(FFConfiguration configuration,
                    Environment environment) {
        final SayingResource resource = new SayingResource(
                configuration.getWord()
        );
        /* set up CORS to help our browser friends */
        final FilterRegistration.Dynamic cors = environment.servlets().addFilter("crossOriginRequests", CrossOriginFilter.class);
        cors.addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), true, "/*");

        environment.jersey().register(resource);
        //final EntityManager entityManager = entityManagerBundle.getSharedEntityManager();
        final ImageResource imgResource = new ImageResource(entityManagerBundle.getSharedEntityManager());
        environment.jersey().register(imgResource);
        environment.jersey().register(new TagResource(entityManagerBundle.getSharedEntityManager()));
        environment.jersey().register(new StatsResource(entityManagerBundle.getSharedEntityManager()));
    }
    public static void main(String[] args) throws Exception {
        new FFApplication().run(args);
    }
}
