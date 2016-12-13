package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ImageDTO {

    private String base, full, date;
    private long timestamp;

    public ImageDTO(String base, long timestamp, String full, String date) {
        this.base = base;
        this.timestamp = timestamp;
        this.full = full;
        this.date = date;
    }

    @JsonProperty
    public String getBase() {
        return base;
    }

    public ImageDTO setBase(String base) {
        this.base = base;
        return this;
    }

    @JsonProperty
    public String getFull() {
        return full;
    }

    public ImageDTO setFull(String full) {
        this.full = full;
        return this;
    }

    @JsonProperty
    public String getDate() {
        return date;
    }

    public ImageDTO setDate(String date) {
        this.date = date;
        return this;
    }

    @JsonProperty
    public long getTimestamp() {
        return timestamp;
    }

    public ImageDTO setTimestamp(long timestamp) {
        this.timestamp = timestamp;
        return this;
    }

    @Override
    public String toString() {
        return "ImageDTO{" +
                "base='" + base + '\'' +
                ", full='" + full + '\'' +
                ", date='" + date + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
