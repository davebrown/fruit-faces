package com.moonspider.ff.commands;

import com.moonspider.ff.FFApplication;
import com.moonspider.ff.FFConfiguration;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.ejb.TagEJB;
import com.moonspider.ff.ejb.UserEJB;
import io.dropwizard.cli.ConfiguredCommand;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.hibernate.HibernateBundle;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import net.sourceforge.argparse4j.inf.MutuallyExclusiveGroup;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import org.apache.commons.io.FileUtils;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.internal.ThreadLocalSessionContext;

import java.io.File;
import java.util.List;

public class EJBCommand extends ConfiguredCommand<FFConfiguration> {

    private final FFApplication application;

    public EJBCommand(FFApplication application) {
        super("ejb", "EJB operations from command line");
        this.application = application;
    }

    @Override
    public void configure(Subparser subparser) {
        super.configure(subparser);
        MutuallyExclusiveGroup grp = subparser.addMutuallyExclusiveGroup()
                .required(true);

        grp.addArgument("-q", "--query")
                .dest("query")
                .type(String.class)
                .help("EJB-QL query string");
        grp.addArgument("-f", "--file")
                .dest("queryFile")
                .type(String.class)
                .help("read query from a file");
    }

        @Override
    protected void run(Bootstrap<FFConfiguration> bootstrap, Namespace namespace, FFConfiguration configuration) throws Exception {

            HibernateBundle<FFConfiguration> hibernateBundle =
                    new HibernateBundle<FFConfiguration>(ImageEJB.class, TagEJB.class, UserEJB.class) {
                        @Override
                        public DataSourceFactory getDataSourceFactory(FFConfiguration configuration) {
                            return configuration.getDataSourceFactory();
                        }
                    };

            configuration.getDataSourceFactory().getProperties().put(AvailableSettings.CURRENT_SESSION_CONTEXT_CLASS,
                    ThreadLocalSessionContext.class.getName());
            hibernateBundle.run(configuration,
                    new Environment("EnvName", bootstrap.getObjectMapper(),
                            bootstrap.getValidatorFactory(),
                            bootstrap.getMetricRegistry(),
                            bootstrap.getClassLoader(),
                            bootstrap.getHealthCheckRegistry(),
                            configuration));

            SessionFactory sessionFactory = hibernateBundle.getSessionFactory();
            Session session = sessionFactory.openSession();
            session.beginTransaction();
            
            String query = namespace.getString("query");
            if (query == null) {
                File f = new File(namespace.getString("queryFile"));
                query = FileUtils.readFileToString(f, "UTF-8");
            }
            if (query.indexOf("\n") == -1) {
                System.out.println("executing: " + query);
            } else {
                System.out.println("executing: " + query.substring(0, Math.min(70, query.length())) + "... (" + query.length() + " chars)");
            }
            List results = session.createQuery(query).list();
            System.out.println(results.size() + " result(s)");
            for (Object o : results) {
                System.out.println("  " + o);
            }
            session.getTransaction().commit();
            session.close();
    }
}
