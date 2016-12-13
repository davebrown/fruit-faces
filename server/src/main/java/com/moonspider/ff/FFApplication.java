package com.moonspider.ff;

import com.scottescue.dropwizard.entitymanager.EntityManagerBundle;
import com.scottescue.dropwizard.entitymanager.ScanningEntityManagerBundle;
import io.dropwizard.Application;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;

import javax.persistence.EntityManager;

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
        environment.jersey().register(resource);
        //final EntityManager entityManager = entityManagerBundle.getSharedEntityManager();
        final ImageResource imgResource = new ImageResource(entityManagerBundle.getSharedEntityManager());
        environment.jersey().register(imgResource);
        System.out.println("**** REGISTERED RESOURCES ***** db in config is: " + configuration.getDataSourceFactory());
    }
    public static void main(String[] args) throws Exception {
        new FFApplication().run(args);
    }
}
