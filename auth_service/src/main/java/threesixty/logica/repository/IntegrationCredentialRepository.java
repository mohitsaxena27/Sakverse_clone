package threesixty.logica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import threesixty.logica.DTO.ProjectIntegrationDTO;
import threesixty.logica.model.IntegrationCredentials;

import java.util.List;


@Repository
public interface IntegrationCredentialRepository  extends JpaRepository<IntegrationCredentials, Long> {
    @Query("SELECT new threesixty.logica.DTO.ProjectIntegrationDTO(" +
            "i.project.id, i.type, i.url, i.enable,i.tool,c.username, c.password,i.project.llm_model,i.additional_config) " +
            "FROM IntegrationCredentials c " +
            "JOIN c.integration i " +
            "WHERE c.project.id = :projectId AND c.user.id = :userId")
    List<ProjectIntegrationDTO> findCredentialsWithIntegrationInfo(Long projectId, Long userId); // Note the field name is userId in User entity

    @Query("SELECT new threesixty.logica.DTO.ProjectIntegrationDTO(" +
            "i.project.id, i.type, i.url, i.enable, i.tool, c.username, c.password,i.project.llm_model,i.additional_config) " +
            "FROM IntegrationCredentials c " +
            "JOIN c.integration i " +
            "WHERE i.project.id = :projectId AND c.user.id = :userId AND i.type= :type")
    ProjectIntegrationDTO findCredentialsWithIntegrationtype(Long projectId, Long userId,String type);

}
