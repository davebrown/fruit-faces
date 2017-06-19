package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class IdDTO {

    @JsonProperty
    public String id;

    @Override
    public String toString() {
        return "IdDTO{" +
                "id='" + id + '\'' +
                '}';
    }
}
