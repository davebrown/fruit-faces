package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.HashSet;
import java.util.Set;

public class PingDTO {

    @JsonProperty
    private Set<Resource> resources;
    public PingDTO() {
        resources = new HashSet();
    }

    @JsonProperty("status")
    public ResourceStatus getStatus() {
        ResourceStatus ret = ResourceStatus.OK;
        for (Resource r : resources) {
            if (r.status != ResourceStatus.OK) {
                ret = ResourceStatus.ERROR;
                break;
            }
        }
        return ret;
    }

    public PingDTO addResource(Resource res) {
        resources.add(res);
        return this;
    }
    public PingDTO addResource(String name, ResourceStatus status) {
        return addResource(name, status, null);
    }
    public PingDTO addResource(String name, ResourceStatus status, String error) {
        resources.add(new Resource(name, status, error));
        return this;
    }

    public static enum ResourceStatus {
        OK, ERROR
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Resource {
        @JsonProperty
        private String name;
        @JsonProperty
        private String error;
        @JsonProperty
        private ResourceStatus status;

        public Resource() { }

        public Resource(String name, ResourceStatus status) {
            this.name = name;
            this.status = status;
        }

        public Resource(String name, ResourceStatus status, String error) {
            this(name, status);
            this.error = error;
        }
    }
}
