package com.moonspider.ff.commands;

import com.moonspider.ff.FFConfiguration;
import com.moonspider.ff.ejb.ImageEJB;
import com.scottescue.dropwizard.entitymanager.EntityManagerBundle;
import com.scottescue.dropwizard.entitymanager.ScanningEntityManagerBundle;
import io.dropwizard.cli.ConfiguredCommand;
import io.dropwizard.db.DataSourceFactory;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.internal.ThreadLocalSessionContext;

import javax.persistence.EntityManager;
import javax.persistence.EntityTransaction;
import javax.persistence.Query;
import java.util.List;

public class EJBCommand extends ConfiguredCommand<FFConfiguration> {

    public EJBCommand() {
        super("ejb", "EJB operations from command line");
    }

    @Override
    public void configure(Subparser subparser) {
        super.configure(subparser);
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
            System.out.println("got em: " + em);

            EntityTransaction tx = em.getTransaction();
            tx.begin();
            Query q = em.createQuery("SELECT i from ImageEJB i");
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
