package threesixty.logica.model;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "role")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    // One Role can have many Permissions
//    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, mappedBy = "role_id")  // "role" is the field in Permissions
//    private List<Permissions> permissions;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(referencedColumnName = "role_id", nullable = false)
//    private Permissions permissions;


    // Default constructor
    public Role() {}

    // Constructor with parameters
    public Role(String roleName, Permissions permissions) {
        this.roleName = roleName;
//        this.permissions = permissions;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

//    public Permissions getPermissions() {
//        return permissions;
//    }
//
//    public void setPermissions(Permissions permissions) {
//        this.permissions = permissions;
//    }
}
