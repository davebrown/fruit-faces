/*
 * Copyright (c) 2005, Gauntlet Systems Corporation. All Rights Reserved.
 */

package com.moonspider.ff.ejb;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.moonspider.ff.model.ImageDTO;

import java.util.*;
import javax.persistence.*;

@Entity
@Table(name="image")
public class ImageEJB
{

    public ImageEJB() { }

    public ImageEJB(String base) {
        setBase(base);
    }
    public ImageEJB(ImageDTO dto) {
        setBase(dto.getBase());
        setFull(dto.getFull());
        setTstamp(new Date(dto.getTimestamp()));
    }
    // Columns
    
    @Id
    @Column(name="base")
    @JsonProperty
    public String getBase() {
        return this.base;
    }
    private void setBase(String base) {
        this.base = base;
    }
    private String base;

    @JsonProperty
    @Column(name="original", nullable=false)
    public String getOriginal() {
        return this.original;
    }
    public void setOriginal(String original) {
        this.original = original;
    }
    private String original;

    @JsonProperty
    @Column(name="full_file", nullable=false)
    public String getFull() {
        return this.full;
    }
    public void setFull(String full) {
        this.full = full;
    }
    private String full;

    @JsonProperty
    @Column(name="tstamp", nullable=true)
    @Temporal(TemporalType.TIMESTAMP)
    public java.util.Date getTstamp() {
        return this.tstamp;
    }
    public void setTstamp(java.util.Date tstamp) {
        this.tstamp = tstamp;
    }
    private java.util.Date tstamp;

    @JsonProperty
    @Column(name="import_time", nullable=false)
    public Date getImportTime() { return importTime; }
    public void setImportTime(Date importTime) { this.importTime = importTime; }
    private java.util.Date importTime;

    /*
    @JsonProperty
    @Column(name="user_id", nullable = false)
    public String getUserId() {
        return userId;
    }
    public void setUserId(String u) { userId = u; }
    private String userId;
    */
    /* this field should exist in JSON but not JPA - but how to reconcile annotations??
    @Transient
    @JsonProperty
    public Collection<String> getTags() {
        Collection<String> ret = new ArrayList<>();
        Collection<TagEJB> tags = getTagList();
        tags.forEach(tag->ret.add(tag.getName()));
        return ret;
    }
    */


    // Relations
    @ManyToOne(
            cascade = {},
            fetch = FetchType.EAGER
    )
    @JoinColumn(
            name = "user_id",
            referencedColumnName = "fb_id"
    )
    public UserEJB getUser() {
        return user;
    }

    public void setUser(UserEJB user) {
        this.user = user;
    }
    private UserEJB user;

    // Relation name: base-tag
    @ManyToMany(
        // not mapped by
        cascade = {},
        fetch = FetchType.LAZY)
    
    @JoinTable(
      name="image_tag",
      joinColumns={@JoinColumn(name="image_id")},
      inverseJoinColumns={@JoinColumn(name="tag_id")}
    )
    @JsonIgnore
    public Collection<TagEJB> getTagList() {
        return this.myTagList != null ? this.myTagList : Collections.EMPTY_LIST;
    }
    public void setTagList(Collection<TagEJB> myTagList) {
        this.myTagList = myTagList;
    }
    private Collection<TagEJB> myTagList;
    

    public String toString() {
        StringBuffer sb = new StringBuffer();
        sb.append(this.getClass().getName() + "|");
        sb.append("base=" + getBase() + "|");
        sb.append("full=" + getFull() + "|");
        sb.append("tstamp=" + getTstamp() + "|");
        
        return sb.toString();
    }
}