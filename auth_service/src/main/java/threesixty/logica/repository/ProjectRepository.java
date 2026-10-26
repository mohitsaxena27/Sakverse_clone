package threesixty.logica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import threesixty.logica.model.Project;


@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
}
