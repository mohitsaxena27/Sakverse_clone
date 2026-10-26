package threesixty.logica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import threesixty.logica.DTO.ProjectAssignmentResponse;
import threesixty.logica.model.Project;
import threesixty.logica.model.ProjectAssignment;
import threesixty.logica.model.Role;
import threesixty.logica.model.User;
import threesixty.logica.repository.ProjectAssignmentRepository;
import threesixty.logica.repository.ProjectRepository;
import threesixty.logica.repository.RoleRepository;
import threesixty.logica.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProjectAssignmentService {

    @Autowired
    private ProjectAssignmentRepository projectAssignmentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;
    public List<ProjectAssignmentResponse> getAssignedProjects(Long username) {
        // Fetch the user’s assigned projects from the database
        System.out.println("***************"+username+"*****************");

        List<ProjectAssignment> projectAssignments = projectAssignmentRepository.findByUserUserId(username);
        System.out.println(projectAssignments);

        // Convert the results into a custom response object
        return projectAssignments.stream().map(assignment -> {
            Project project = projectRepository.findById(assignment.getProject().getId()).orElseThrow();
            Role role = roleRepository.findById(assignment.getRole().getId()).orElseThrow();

            // Map to the response
            return new ProjectAssignmentResponse(
                    project.getId(),project.getName(),project.getType(),role.getRoleName(),project.getLink()
            );
        }).collect(Collectors.toList());
    }
}
