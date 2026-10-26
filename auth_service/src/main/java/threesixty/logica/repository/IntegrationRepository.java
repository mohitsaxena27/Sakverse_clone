package threesixty.logica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import threesixty.logica.model.Project_integartion;

import java.util.Optional;

@Repository
public interface IntegrationRepository extends JpaRepository<Project_integartion, Long> {
    @Query("SELECT i FROM Project_integartion i " +
            "WHERE i.project.id = :projectId AND i.type = :type")
    Optional<Project_integartion> findByProjectIdAndType(Long projectId, String type);

    // Custom queries if needed, e.g.:
    // List<IntegrationCredentialEntity> findByProjectId(Long projectId);
}
