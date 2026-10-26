package threesixty.logica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import threesixty.logica.DTO.ProjectCreateDTO;
import threesixty.logica.DTO.UserCreateDTO;
import threesixty.logica.model.Project;
import threesixty.logica.model.ProjectAssignment;
import threesixty.logica.model.Role;
import threesixty.logica.model.User;
import threesixty.logica.repository.ProjectAssignmentRepository;
import threesixty.logica.repository.ProjectRepository;
import threesixty.logica.repository.UserRepository;

@Service
public class AdminService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectAssignmentRepository projectAssignmentRepository;

    @Transactional
    public Long createProject(ProjectCreateDTO projectDTO) {
        Project project = new Project();
        project.setName(projectDTO.getProject().getProject_name());
        project.setType("Manual");
        project.setdescription(projectDTO.getProject().getDescription());
        project.setLink(false);
        project.setmanula_repo(projectDTO.getProject().getManual_repo());
        project.setAutomation_repo(projectDTO.getProject().getAutomation_repo());
        Project savedProject = projectRepository.save(project);
        return savedProject.getId();
    }

    @Transactional
    public Long createUser(UserCreateDTO userDTO) {
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setPassword(userDTO.getPassword());
        user.setUserDisplayName(userDTO.getUserDisplayName());
        user.setRole(userDTO.getRole());
        user.setEnabled(userDTO.isEnabled());
        user.setLlm_key(userDTO.getApiKey());
        user.setRole(userDTO.getRole());
        User savedUser = userRepository.save(user);
        return savedUser.getUserId();
    }

    @Transactional
    public void assignUserToProject(Long userId, Long projectId, int roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Role role = new Role();
        role.setId((long) roleId);

        ProjectAssignment assignment = new ProjectAssignment(user, project, role);
        projectAssignmentRepository.save(assignment);
    }
}