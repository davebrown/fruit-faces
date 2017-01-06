package com.moonspider.ff;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.dropwizard.Configuration;
import io.dropwizard.db.DataSourceFactory;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

public class FFConfiguration extends Configuration {

    @Valid
    @NotNull
    @JsonProperty
    private DataSourceFactory database = new DataSourceFactory();

    @Valid
    @NotNull
    @JsonProperty
    private boolean allowWriteOperations;

    public DataSourceFactory getDataSourceFactory() {
        return database;
    }

    public void setDataSourceFactory(DataSourceFactory s) {
        this.database = s;
    }

    public boolean isAllowWriteOperations() { return allowWriteOperations; }
    public void setAllowWriteOperations(boolean b) { this.allowWriteOperations = b; }
}
