package threesixty.logica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import threesixty.logica.model.Project;
import threesixty.logica.model.ProjectAssignment;

import java.util.List;


@Repository
public interface ProjectAssignmentRepository extends JpaRepository<ProjectAssignment, Long> {
    List<ProjectAssignment> findByUserUserId(Long userId); // Note the field name is userId in User entity

}
