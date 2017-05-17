package com.moonspider.ff.ejb;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.List;

@Entity
@Table(name="ff_user")
public class UserEJB {

    private String fbId, email, name;
    private Integer id;

    @Id
    @Column(name="fb_id")
    @NotNull
    public String getFbId() {
        return fbId;
    }

    public void setFbId(String fbId) {
        this.fbId = fbId;
    }

    // http://stackoverflow.com/questions/11825643/configure-jpa-to-let-postgresql-generate-the-primary-key-value
    @Column(updatable = false, insertable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
            generator = "ff_user_id_seq"
    )
    @SequenceGenerator(name="ff_user_id_seq",
            sequenceName="ff_user_id_seq",
            allocationSize=1)
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    @Column
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Column
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    /*
    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.REMOVE,
            fetch = FetchType.LAZY
    )
    public List<ImageEJB> getImages() {
        return imageEJBList;
    }

    public void setImages(List<ImageEJB> l) {
        imageEJBList = l;
    }
    private List<ImageEJB> imageEJBList;
*/
    @Override
    public String toString() {
        return "UserEJB{" +
                "id=" + id +
                ", fbId='" + fbId + '\'' +
                ", email='" + email + '\'' +
                ", name='" + name + '\'' +
                '}';
    }
}
