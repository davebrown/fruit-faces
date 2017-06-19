package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.HashMap;
import java.util.Map;

public class PermissionsDTO {

    private Map<String,Boolean> data;

    public PermissionsDTO() {
        data = new HashMap();
    }

    @JsonProperty
    public Map<String,Boolean> getData() { return data; }
    public void setData(Map<String,Boolean> data) {
        this.data = data;
    }

    public boolean hasPermission(final String name) {
        return data != null && data.getOrDefault(name, false);
    }
    @Override
    public String toString() {
        return "PermissionsDTO{" +
                "data=" + data +
                '}';
    }
}
