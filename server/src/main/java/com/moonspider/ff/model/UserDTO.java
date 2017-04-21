package com.moonspider.ff.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.moonspider.ff.ejb.UserEJB;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDTO {

    private String id, email, name;

    public UserDTO() { }
    public UserDTO(UserEJB ejb) {
        id = ejb.getFbId();
        email = ejb.getEmail();
        name = ejb.getName();
    }

    @JsonProperty(value="id")
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    @Override
    public String toString() {
        return "UserDTO{" +
                "id='" + id + '\'' +
                ", email='" + email + '\'' +
                ", name='" + name + '\'' +
                '}';
    }


}
