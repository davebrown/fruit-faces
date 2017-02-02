package com.moonspider.ff;

import com.moonspider.ff.commands.VersionCommand;
import com.robertcboll.dropwizard.daemon.DaemonApplication;
import com.scottescue.dropwizard.entitymanager.EntityManagerBundle;
import com.scottescue.dropwizard.entitymanager.ScanningEntityManagerBundle;
import com.sun.akuma.Daemon;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.db.PooledDataSourceFactory;
import io.dropwizard.forms.MultiPartBundle;
import io.dropwizard.migrations.MigrationsBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.eclipse.jetty.servlets.CrossOriginFilter;

import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration;
import java.util.EnumSet;
import java.util.TimeZone;

public class FFApplication extends DaemonApplication<FFConfiguration> {

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
        bootstrap.addCommand(new VersionCommand());
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
        try {
            startup(args);
        } catch (Throwable t) {
            // log to stderr as well as log, since logging may not have initialized
            System.err.println("startup failed: " + t);
            t.printStackTrace();
            log.error("startup failed, exiting", t);
            System.exit(1);
        }
    }

    private static void startup(String[] args) throws Exception {
        // see http://stackoverflow.com/questions/508019/jpa-hibernate-store-date-in-utc-time-zone
        // still a FIXME: for using UTC in the DB

        TimeZone.setDefault(TimeZone.getTimeZone("America/Los_Angeles"));
        FFApplication app = new FFApplication();
        final String pidFile = System.getenv().getOrDefault("PIDFILE", System.getProperty("user.home") + "/ff.pid");
        app.daemonize(pidFile).run(args);
    }
}
