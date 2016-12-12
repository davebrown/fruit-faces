package com.moonspider.ff;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.dropwizard.Configuration;
import io.dropwizard.db.DataSourceFactory;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

/**
 * Created by dave on 12/11/16.
 */
public class FFConfiguration extends Configuration {

    @Valid
    @NotNull
    @JsonProperty
    private DataSourceFactory database = new DataSourceFactory();

    public DataSourceFactory getDataSourceFactory() {
        return database;
    }

    public void setDataSourceFactory(DataSourceFactory s) {
        this.database = s;
    }

    @NotNull
    @JsonProperty
    private String word;

    public String getWord() {
        return word;
    }

    public void setWord(String s) {
        this.word = s;
    }
}
