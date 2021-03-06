package com.moonspider.ff.commands;

import com.moonspider.ff.FFConfiguration;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.ejb.UserEJB;
import com.scottescue.dropwizard.entitymanager.EntityManagerBundle;
import com.scottescue.dropwizard.entitymanager.ScanningEntityManagerBundle;
import io.dropwizard.cli.ConfiguredCommand;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import net.sourceforge.argparse4j.inf.MutuallyExclusiveGroup;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import org.apache.commons.io.FileUtils;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.internal.ThreadLocalSessionContext;

import javax.persistence.EntityManager;
import javax.persistence.EntityTransaction;
import javax.persistence.Query;
import java.io.File;
import java.util.List;

public class EJBCommand extends ConfiguredCommand<FFConfiguration> {

    public EJBCommand() {
        super("ejb", "EJB operations from command line");
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

            EntityManagerBundle<FFConfiguration> entityManagerBundle =
                    new ScanningEntityManagerBundle<FFConfiguration>("com.moonspider.ff.ejb") {
                        @Override
                        public DataSourceFactory getDataSourceFactory(FFConfiguration configuration) {
                            return configuration.getDataSourceFactory();
                        }
                    };

            configuration.getDataSourceFactory().getProperties().put(AvailableSettings.CURRENT_SESSION_CONTEXT_CLASS,
                    ThreadLocalSessionContext.class.getName());
            entityManagerBundle.run(configuration,
                    new Environment("EnvName", bootstrap.getObjectMapper(),
                            bootstrap.getValidatorFactory().getValidator(),
                            bootstrap.getMetricRegistry(),
                            bootstrap.getClassLoader()));

            EntityManager em = entityManagerBundle.getEntityManagerFactory().createEntityManager();
            String query = namespace.getString("query");
            if (query == null) {
                query = FileUtils.readFileToString(new File(namespace.getString("queryFile")), "utf8");
            }
            System.out.println("executing '" + query + "'");
            EntityTransaction tx = em.getTransaction();
            tx.begin();
            if (false) {
                UserEJB user = new UserEJB();
                user.setName("Daffy Duck");
                user.setEmail("daffy@duck.org");
                user.setFbId("987654321");
                em.persist(user);
                tx.commit();
                System.out.println("persisted and committed: " + user);
                em.refresh(user);
                System.out.println("after refresh: " + user);
                return;
            }
            //Query q = em.createQuery("SELECT i from ImageEJB i");
            Query q = em.createQuery(query);
            List l = q.getResultList();
            System.out.println("got " + l.size() + " result(s):");
            for (Object o : l) {
                System.out.println(o);
                if (o instanceof ImageEJB) {
                    ImageEJB i = (ImageEJB)o;
                    System.out.println("owner is " + i.getUser());
                }
            }
            tx.rollback();
    }
}
