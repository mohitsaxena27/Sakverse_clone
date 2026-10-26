package threesixty.logica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import threesixty.logica.DTO.ProjectAssignmentResponse;
import threesixty.logica.DTO.ProjectIntegrationDTO;
import threesixty.logica.model.Project;
import threesixty.logica.model.ProjectAssignment;
import threesixty.logica.model.Project_integartion;
import threesixty.logica.model.Role;
import threesixty.logica.repository.*;

import java.util.List;
import java.util.stream.Collectors;
@Service
public class ProjectIntegrationService {

    @Autowired
    private IntegrationCredentialRepository projectIntegationRepository;

    @Autowired
    private ProjectRepository projectRepository;


    @Autowired
    private UserRepository userRepository;

    public List<ProjectIntegrationDTO> getIntegrations(Long project_id,Long user_id) {
        // Fetch the user’s assigned projects from the database
//        System.out.println("***************"+project_id+"*****************");
//
//        List<Project_integartion> Integrations = projectIntegationRepository.findCredentialsWithIntegrationInfo(project_id,user_id);
//        System.out.println(Integrations);
//
//        // Convert the results into a custom response object
//
//        return Integrations.stream().map(assignment -> {
//            Project project = projectRepository.findById(project_id).orElseThrow();
//            List<Project_integartion> Project_integartion=projectIntegationRepository.findCredentialsWithIntegrationInfo(project_id,user_id);
//
//            // Map to the response
//            return new ProjectIntegrationDTO(
//                    project.getId(),assignment.getType(),assignment.getURL(),assignment.getEnable()
//            );
//        }).collect(Collectors.toList());
        System.out.println("***************"+project_id+"*****************"+user_id+"*****************");
        return projectIntegationRepository.findCredentialsWithIntegrationInfo(project_id, user_id);
    }

    public ProjectIntegrationDTO getIntegrationbyType(Long project_id,Long user_id,String type) {
        // Fetch the user’s assigned projects from the database
//        System.out.println("***************"+project_id+"*****************");
//
//        List<Project_integartion> Integrations = projectIntegationRepository.findCredentialsWithIntegrationInfo(project_id,user_id);
//        System.out.println(Integrations);
//
//        // Convert the results into a custom response object
//
//        return Integrations.stream().map(assignment -> {
//            Project project = projectRepository.findById(project_id).orElseThrow();
//            List<Project_integartion> Project_integartion=projectIntegationRepository.findCredentialsWithIntegrationInfo(project_id,user_id);
//
//            // Map to the response
//            return new ProjectIntegrationDTO(
//                    project.getId(),assignment.getType(),assignment.getURL(),assignment.getEnable()
//            );
//        }).collect(Collectors.toList());
        System.out.println(project_id+"----"+user_id+"-------"+type);
        return projectIntegationRepository.findCredentialsWithIntegrationtype(project_id, user_id,type);
    }
}
