package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.moonspider.ff.ejb.UserEJB;

@JsonInclude(JsonInclude.Include.NON_NULL)

public class UserDTO {

    private String id, email, name, profileUrl;
    private int ffId;
    private PermissionsDTO permissions;

    public UserDTO() { }

    public UserDTO(UserEJB ejb) {
        ffId = ejb.getId();
        id = ejb.getFbId();
        email = ejb.getEmail();
        name = ejb.getName();
        profileUrl = ejb.getProfileUrl();
        permissions = ejb.getPermissions();
    }

    @JsonProperty
    public String getProfileUrl() {
        return profileUrl;
    }

    public void setProfileUrl(String profileUrl) {
        this.profileUrl = profileUrl;
    }


    @JsonProperty(value="fbId")
    public String getFbId() {
        return id;
    }

    public void setFbId(String id) {
        this.id = id;
    }

    @JsonProperty("ffId")
    public int getId() {
        return ffId;
    }

    public void setId(int id) {
        this.ffId = id;
    }

    @JsonProperty
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @JsonProperty
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @JsonProperty("permissions")
    public PermissionsDTO getPermissions() { return permissions; }
    public void setPermissions(PermissionsDTO p) {
        permissions = p;
    }

    @Override
    public String toString() {
        return "UserDTO{" +
                "ffId='" + ffId + '\'' +
                ", id='" + id + '\'' +
                ", email='" + email + '\'' +
                ", name='" + name + '\'' +
                ", profilePic='" + profileUrl + '\'' +
                ", permissions=" + permissions +
                '}';
    }


}
