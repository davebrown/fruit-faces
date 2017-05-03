package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Arrays;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TagsDTO {
    private static final String[] EMPTY = new String[0];
    private String[] tags;

    public TagsDTO() {
        tags = EMPTY;
    }

    @JsonProperty
    public String[] getTags() {
        return tags;
    }

    public void setTags(String[] tags) {
        this.tags = tags != null ? tags : EMPTY;
    }

    @Override
    public String toString() {
        return "TagsDTO{" +
                "tags=" + Arrays.toString(tags) +
                '}';
    }
}
