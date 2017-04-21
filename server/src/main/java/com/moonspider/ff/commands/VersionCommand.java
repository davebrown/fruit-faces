package com.moonspider.ff.commands;

import com.moonspider.ff.FFConfiguration;
import com.moonspider.ff.InfoResource;
import io.dropwizard.cli.Command;
import io.dropwizard.cli.ConfiguredCommand;
import io.dropwizard.setup.Bootstrap;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;

import java.util.Map;

public class VersionCommand extends ConfiguredCommand<FFConfiguration> {

    public VersionCommand() {
        super("version", "Prints build version");
    }
    @Override
    public void configure(Subparser subparser) {
        super.configure(subparser);
    }

    @Override
    protected void run(Bootstrap<FFConfiguration> bootstrap, Namespace namespace, FFConfiguration ffConfig) throws Exception {
        Map<String,String> buildInfo = InfoResource.BUILD_INFO;
        System.out.println(String.format("git revision: %s", buildInfo.get("revision")));
        System.out.println(String.format("revision timestamp: %s", buildInfo.get("revision_timestamp")));
        System.out.println(String.format("build timestamp: %s", buildInfo.get("build_timestamp")));
        System.out.println(String.format("thumb directory: %s", ffConfig.getThumbDir().getAbsolutePath()));

    }

}
