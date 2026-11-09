package com.moonspider.ff;

import com.moonspider.ff.commands.EJBCommand;
import com.moonspider.ff.commands.VersionCommand;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.ejb.TagEJB;
import com.moonspider.ff.ejb.UserEJB;
import io.dropwizard.core.Application;

import io.dropwizard.configuration.EnvironmentVariableSubstitutor;
import io.dropwizard.configuration.SubstitutingSourceProvider;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.forms.MultiPartBundle;
import io.dropwizard.hibernate.HibernateBundle;
import io.dropwizard.migrations.MigrationsBundle;
import io.dropwizard.core.setup.Bootstrap;
import io.dropwizard.core.setup.Environment;
import org.eclipse.jetty.server.handler.CrossOriginHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.TimeZone;
import java.util.Set;

public class FFApplication extends Application<FFConfiguration> {

    private static final Logger log = LoggerFactory.getLogger(FFApplication.class);

    private final HibernateBundle<FFConfiguration> hibernateBundle =
            new HibernateBundle<FFConfiguration>(ImageEJB.class, TagEJB.class, UserEJB.class) {
                @Override
                public DataSourceFactory getDataSourceFactory(FFConfiguration configuration) {
                    return configuration.getDataSourceFactory();
                }
            };

    private final MigrationsBundle<FFConfiguration> migrationsBundle =
            new MigrationsBundle<FFConfiguration>() {
                @Override
                public DataSourceFactory getDataSourceFactory(FFConfiguration ffConfiguration) {
                    return ffConfiguration.getDataSourceFactory();
                }

                @Override
                public String getMigrationsFileName() {
                    return "migrations.postgresql.sql";
                }
            };

    @Override
    public void initialize(Bootstrap<FFConfiguration> bootstrap) {
        // Enable variable substitution with environment variables
        bootstrap.setConfigurationSourceProvider(
                new SubstitutingSourceProvider(bootstrap.getConfigurationSourceProvider(),
                        new EnvironmentVariableSubstitutor()
                )
        );
        bootstrap.addBundle(migrationsBundle);
        bootstrap.addBundle(hibernateBundle);
        bootstrap.addBundle(new MultiPartBundle());
        bootstrap.addCommand(new VersionCommand());
        bootstrap.addCommand(new EJBCommand(this));
    }

    @Override
    public void run(FFConfiguration config,
                    Environment environment) {
        CrossOriginHandler cors = new CrossOriginHandler();
        cors.setAllowedOriginPatterns(Set.of(".*"));
        cors.setAllowCredentials(true);
        cors.setAllowedHeaders(Set.of("X-Requested-With", "Content-Type", "Accept", "Origin",
                "X-FF-Auth", "X-FF-Prevent-Duplicates"));
        cors.setAllowedMethods(Set.of("OPTIONS", "GET", "PUT", "POST", "DELETE", "HEAD"));
        environment.getApplicationContext().insertHandler(cors);
        final ImageResource imgResource = new ImageResource(hibernateBundle.getSessionFactory(), config);
        environment.jersey().register(imgResource);
        environment.jersey().register(new TagResource(hibernateBundle.getSessionFactory(), config));
        environment.jersey().register(new StatsResource(hibernateBundle.getSessionFactory(), config));
        environment.jersey().register(new InfoResource(hibernateBundle.getSessionFactory(), config));
        environment.jersey().register(new UserResource(hibernateBundle.getSessionFactory(), config));
        environment.jersey().register(new PreviewResource(hibernateBundle.getSessionFactory(), config));
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
        app.run(args);
    }
}
