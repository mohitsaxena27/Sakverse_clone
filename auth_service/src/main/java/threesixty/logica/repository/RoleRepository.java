package threesixty.logica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import threesixty.logica.model.Role;


@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
}
