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

    public ImageEJB(ImageDTO dto) {
        setBase(dto.getBase());
        setFull(dto.getFull());
        setTstamp(new Date(dto.getTimestamp()));
        setDatestr(dto.getDate());
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
    
    @Column(name="datestr", nullable=true)
    @JsonProperty
    public String getDatestr() {
        return this.datestr;
    }
    public void setDatestr(String datestr) {
        this.datestr = datestr;
    }
    private String datestr;

    @JsonProperty
    @Column(name="full", nullable=false)
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
        return this.myTagList;
    }
    public void setTagList(Collection<TagEJB> myTagList) {
        this.myTagList = myTagList;
    }
    private Collection<TagEJB> myTagList;
    

    public String toString() {
        StringBuffer sb = new StringBuffer();
        sb.append(this.getClass().getName() + "|");
        sb.append("base=" + getBase() + "|");
        sb.append("datestr=" + getDatestr() + "|");
        sb.append("full=" + getFull() + "|");
        sb.append("tstamp=" + getTstamp() + "|");
        
        return sb.toString();
    }
}