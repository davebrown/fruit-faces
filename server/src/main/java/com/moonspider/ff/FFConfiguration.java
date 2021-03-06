package com.moonspider.ff;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.dropwizard.Configuration;
import io.dropwizard.db.DataSourceFactory;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.File;

public class FFConfiguration extends Configuration {

    @Valid
    @NotNull
    @JsonProperty
    private DataSourceFactory database = new DataSourceFactory();

    @Valid
    @NotNull
    @JsonProperty
    private boolean allowWriteOperations;

    @Valid
    @NotNull
    @JsonProperty
    private long maxImageFileSize;

    @Valid
    @NotNull
    @JsonProperty("thumbDir")
    private String thumbDirPath;

    @Valid
    @NotNull
    @JsonProperty
    private int rootUserId;

    @Valid
    @NotNull
    @JsonProperty
    private String tagServiceUrl;

    public String getFbAppId() {
        return fbAppId;
    }

    public void setFbAppId(String fbAppId) {
        this.fbAppId = fbAppId;
    }

    @Valid
    @NotNull
    @JsonProperty

    private String fbAppId;

    public String getBaseProtocol() {
        return baseProtocol;
    }

    public void setBaseProtocol(String baseProtocol) {
        this.baseProtocol = baseProtocol;
    }

    @Valid
    @NotNull
    @JsonProperty
    private String baseProtocol;

    @JsonProperty
    private String assetUrlPrefix;

    public DataSourceFactory getDataSourceFactory() {
        return database;
    }

    public void setDataSourceFactory(DataSourceFactory s) {
        this.database = s;
    }

    public boolean isAllowWriteOperations() { return allowWriteOperations; }
    public void setAllowWriteOperations(boolean b) { this.allowWriteOperations = b; }

    public long getMaxImageFileSize() {
        return maxImageFileSize;
    }

    public void setMaxImageFileSize(long maxImageFileSize) {
        this.maxImageFileSize = maxImageFileSize;
    }

    public String getThumbDirPath() { return thumbDirPath; }
    public File getThumbDir() { return new File(thumbDirPath); }
    public int getRootUserId() { return rootUserId; }

    public String getTagServiceUrl() {
        return tagServiceUrl;
    }

    public void setTagServiceUrl(String tagServiceUrl) {
        this.tagServiceUrl = tagServiceUrl;
    }

    public String getAssetUrlPrefix() {
        return assetUrlPrefix != null ? assetUrlPrefix : "";
    }

    public void setAssetUrlPrefix(String assetUrlPrefix) {
        this.assetUrlPrefix = assetUrlPrefix;
    }
}
