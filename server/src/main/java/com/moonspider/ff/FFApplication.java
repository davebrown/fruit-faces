package com.moonspider.ff;

import com.scottescue.dropwizard.entitymanager.EntityManagerBundle;
import com.scottescue.dropwizard.entitymanager.ScanningEntityManagerBundle;
import io.dropwizard.Application;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.db.PooledDataSourceFactory;
import io.dropwizard.forms.MultiPartBundle;
import io.dropwizard.migrations.MigrationsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.eclipse.jetty.servlets.CrossOriginFilter;

import javax.persistence.EntityManager;
import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

public class FFApplication extends Application<FFConfiguration> {

    private final EntityManagerBundle<FFConfiguration> entityManagerBundle =
            new ScanningEntityManagerBundle<FFConfiguration>("com.moonspider.ff.ejb") {
                @Override
                public DataSourceFactory getDataSourceFactory(FFConfiguration configuration) {
                    return configuration.getDataSourceFactory();
                }
            };

    private final MigrationsBundle<FFConfiguration> migrationsBundle =
            new MigrationsBundle<FFConfiguration>() {
                @Override
                public PooledDataSourceFactory getDataSourceFactory(FFConfiguration ffConfiguration) {
                    return ffConfiguration.getDataSourceFactory();
                }

                @Override
                public String getMigrationsFileName() {
                    return "migrations.postgresql.sql";
                }
            };
    @Override
    public void initialize(Bootstrap<FFConfiguration> bootstrap) {
        bootstrap.addBundle(migrationsBundle);
        bootstrap.addBundle(entityManagerBundle);
        bootstrap.addBundle(new MultiPartBundle());
    }

    @Override
    public void run(FFConfiguration configuration,
                    Environment environment) {
        /* set up CORS to help our browser friends */
        {
            final FilterRegistration.Dynamic cors = environment.servlets()
                    .addFilter("crossOriginRequests", CrossOriginFilter.class);
            cors.addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), true, "/*");
            cors.setInitParameter("allowedOrigins", "*");
            cors.setInitParameter("allowedHeaders", "X-Requested-With,Content-Type,Accept,Origin");
            cors.setInitParameter("allowedMethods", "OPTIONS,GET,PUT,POST,DELETE,HEAD");
        }
        final ImageResource imgResource = new ImageResource(entityManagerBundle.getSharedEntityManager(), configuration);
        environment.jersey().register(imgResource);
        environment.jersey().register(new TagResource(entityManagerBundle.getSharedEntityManager()));
        environment.jersey().register(new StatsResource(entityManagerBundle.getSharedEntityManager()));
        environment.jersey().register(new InfoResource(entityManagerBundle.getSharedEntityManager()));
    }
    public static void main(String[] args) throws Exception {
        // see http://stackoverflow.com/questions/508019/jpa-hibernate-store-date-in-utc-time-zone
        // still a FIXME: for using UTC in the DB
        TimeZone.setDefault(TimeZone.getTimeZone("America/Los_Angeles"));
        new FFApplication().run(args);
    }
}
