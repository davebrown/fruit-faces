package com.moonspider.ff;

import io.dropwizard.Application;
import io.dropwizard.setup.Environment;

public class FFApplication extends Application<FFConfiguration> {

    @Override
    public void run(FFConfiguration configuration,
                    Environment environment) {
        final SayingResource resource = new SayingResource(
                configuration.getWord()
        );
        environment.jersey().register(resource);
        System.out.println("**** REGISTERED RESOURCES ***** db in config is: " + configuration.getDataSourceFactory());
    }
    public static void main(String[] args) throws Exception {
        new FFApplication().run(args);
    }
}
