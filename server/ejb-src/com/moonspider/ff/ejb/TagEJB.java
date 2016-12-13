/*
 * Copyright (c) 2005, Gauntlet Systems Corporation. All Rights Reserved.
 */

package com.moonspider.ff.ejb;

import java.util.*;
import javax.persistence.*;

@Entity
@Table(name="tag")
public class TagEJB
{
    // Columns
    
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="name")
    public String getName() {
        return this.name;
    }
    private void setName(String name) {
        this.name = name;
    }
    private String name;
    

    // Relations
    
    // Relation name: name-image
    @ManyToMany(
        // not mapped by
        cascade = {},
        fetch = FetchType.LAZY)
    
    @JoinTable(
      name="image_tag",
      joinColumns={@JoinColumn(name="tag_id")},
      inverseJoinColumns={@JoinColumn(name="image_id")}
    )
    public Collection<ImageEJB> getImageList() {
        return this.myImageList;
    }
    public void setImageList(Collection<ImageEJB> myImageList) {
        this.myImageList = myImageList;
    }
    private Collection<ImageEJB> myImageList;
    

    public String toString() {
        StringBuffer sb = new StringBuffer();
        sb.append(this.getClass().getName() + "|");
        sb.append("name=" + getName() + "|");
        
        return sb.toString();
    }
}