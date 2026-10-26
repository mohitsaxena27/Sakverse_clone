package threesixty.logica.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import threesixty.logica.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
