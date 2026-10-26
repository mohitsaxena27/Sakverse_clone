package threesixty.logica.model;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "permissions")  // This represents the actual permissions table
public class Permissions {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")  // Assuming there's a primary key
    private Long id;

    @Column(name = "role_id")  // The foreign key to the role entity
    private Long roleId;

    @Column(name = "can_generate_test_cases")
    private String per1;

    @Column(name = "can_create_suite")
    private String per2;

    @Column(name = "can_view_report")
    private String per3;

    @Transient
    private List<String> permissions;

    // Constructor, Getters, and Setters are omitted for brevity

    // This method is called after the entity is loaded from the database
    @PostLoad
    private void loadPermissions() {
        this.permissions = new ArrayList<>();
        if (per1 != null) this.permissions.add(per1);
        if (per2 != null) this.permissions.add(per2);
        if (per3 != null) this.permissions.add(per3);
    }

    // Optional: Use @PrePersist or @PreUpdate if you want to set per1, per2, per3
    // before saving the entity
    @PrePersist
    @PreUpdate
    private void savePermissions() {
        if (permissions != null && permissions.size() >= 1) this.per1 = permissions.get(0);
        if (permissions != null && permissions.size() >= 2) this.per2 = permissions.get(1);
        if (permissions != null && permissions.size() >= 3) this.per3 = permissions.get(2);
    }
}
