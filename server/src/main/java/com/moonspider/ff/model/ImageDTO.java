package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.moonspider.ff.ejb.ImageEJB;
import com.moonspider.ff.ejb.TagEJB;

import java.util.Collection;
import java.util.Date;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ImageDTO {

    private String base, full;
    private long timestamp;
    private String[] tags;
    private UserDTO user;

    public ImageDTO() {
        // jackson de-serialization
    }

    public ImageDTO(ImageEJB ejb) {
        this.base = ejb.getBase();
        Date d = ejb.getTstamp();
        this.timestamp = d != null ? d.getTime() : -1;
        this.full = ejb.getFull();
        Collection<TagEJB> tlist = ejb.getTagList();
        this.tags = new String[tlist.size()];
        int i = 0;
        for (TagEJB t : tlist) {
            tags[i++] = t.getName();
        }
        user = new UserDTO(ejb.getUser());
        user.setEmail(null);
    }

    @JsonProperty
    public String[] getTags() {
        return tags;
    }

    public void setTags(String[] tags) {
        this.tags = tags;
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
    public long getTimestamp() {
        return timestamp;
    }

    public ImageDTO setTimestamp(long timestamp) {
        this.timestamp = timestamp;
        return this;
    }

    @JsonProperty
    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    @Override
    public String toString() {
        return "ImageDTO{" +
                "base='" + base + '\'' +
                ", full='" + full + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
