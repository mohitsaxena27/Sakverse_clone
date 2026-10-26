package threesixty.logica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import threesixty.logica.DTO.ProjectCreateDTO;
import threesixty.logica.config.AppProperties;
import threesixty.logica.model.*;
import threesixty.logica.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Service
public class AdminServices {
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private IntegrationRepository integrationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private IntegrationCredentialRepository credentialRepository;
    @Autowired
    private ProjectAssignmentRepository assignmentRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private RestTemplate restTemplate;
    @Autowired
    private AppProperties appProperties;

    @Transactional
    public Long createProjectWithDetails(ProjectCreateDTO projectDTO) {
        ProjectCreateDTO.ProjectDTO project = projectDTO.getProject();

        // 1️⃣ Save Project
        Project projectEntity = new Project();
        projectEntity.setName(project.getProject_name());
        projectEntity.setType(project.getProject_type());
        projectEntity.setdescription(project.getDescription());
        projectEntity.setmanula_repo(project.getManual_repo());
        projectEntity.setAutomation_repo(project.getAutomation_repo());
        projectEntity.setLink(project.getLinked() != null ? project.getLinked() : Boolean.FALSE);
        projectEntity.setllm_model(project.getLlm_model());


        projectEntity = projectRepository.save(projectEntity);

        // 2️⃣ Save Integrations
        if (project.getIntegration() != null) {
            for (ProjectCreateDTO.IntegrationDTO integrationDTO : project.getIntegration()) {
                Project_integartion integration = new Project_integartion();
                integration.setpr_id(projectEntity);
                integration.setType(integrationDTO.getType());
                integration.settool(integrationDTO.getTool());
                integration.setUrl(integrationDTO.getURL());
                integration.setConfig(integrationDTO.getAdditional_config());
                integration.setEnable(true);

                integrationRepository.save(integration);
            }
        }

        // 3️⃣ Assign existing users
        if (project.getUsers() != null && project.getUsers().getExisting() != null) {
            for (ProjectCreateDTO.ExitingUserDTO existingUserDTO : project.getUsers().getExisting()) {
                Role role=roleRepository.findById(2L).orElseThrow(() -> new RuntimeException("Role not found "));
                System.out.println("Role id: " + role.getId());
                System.out.println("Role name: " + role.getRoleName());
                User existingUser = userRepository.findById(existingUserDTO.getID())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + existingUserDTO.getID()));

                ProjectAssignment assignment = new ProjectAssignment();

                assignment.setUser(existingUser);
                assignment.setProject(projectEntity);
                assignment.setRole(role); // Optionally set role if needed

                assignmentRepository.save(assignment);
                if (existingUserDTO.getIntegration_creadentials() != null) {
                    for (ProjectCreateDTO.IntegrationCredentialDTO credDTO : existingUserDTO.getIntegration_creadentials()) {
                        Project_integartion integration = integrationRepository
                                .findByProjectIdAndType(projectEntity.getId(), credDTO.getType())
                                .orElse(null);

                        if (integration != null) {
                            IntegrationCredentials credential = new IntegrationCredentials();
                            credential.setintegration_id(integration);
                            credential.setuser_id(existingUser);
                            credential.setproject_id(projectEntity);
                            credential.setUsername(credDTO.getUsername());
                            credential.setPassword(credDTO.getPassword());

                            credentialRepository.save(credential);
                        }
                    }
                }
            }
        }

        // 4️⃣ Add new users
        if (project.getUsers() != null && project.getUsers().getNewUsers() != null) {
            for (ProjectCreateDTO.NewUserDTO newUserDTO : project.getUsers().getNewUsers()) {
                Role role=roleRepository.findById(2L).orElseThrow(() -> new RuntimeException("Role not found "));
                System.out.println("Role id: " + role.getId());
                System.out.println("Role name: " + role.getRoleName());
                User newUser = new User();
                newUser.setUsername(newUserDTO.getUsername());
                System.out.println("Password sent"+newUserDTO.getPassword());
                System.out.println("Password Encoded"+passwordEncoder.encode(newUserDTO.getPassword()));
                System.out.println("Password matched with userpass"+passwordEncoder.matches("userpass",newUserDTO.getPassword()));
                newUser.setPassword(passwordEncoder.encode(newUserDTO.getPassword()));
                newUser.setUserDisplayName(newUserDTO.getUser_display_name());
                newUser.setLlm_key(newUserDTO.getLlm_key());
                newUser.setEnabled(true);
                newUser.setRole(Math.toIntExact(role.getId()));

                newUser = userRepository.save(newUser);

                // Assign user to project
                ProjectAssignment assignment = new ProjectAssignment();
                assignment.setUser(newUser);
                assignment.setProject(projectEntity);
                assignment.setRole(role); // Optionally map role here
                assignmentRepository.save(assignment);

                // Save integration credentials for new user
                if (newUserDTO.getIntegration_creadentials() != null) {
                    for (ProjectCreateDTO.IntegrationCredentialDTO credDTO : newUserDTO.getIntegration_creadentials()) {
                        Project_integartion integration = integrationRepository
                                .findByProjectIdAndType(projectEntity.getId(), credDTO.getType())
                                .orElse(null);

                        if (integration != null) {
                            IntegrationCredentials credential = new IntegrationCredentials();
                            credential.setintegration_id(integration);
                            credential.setuser_id(newUser);
                            credential.setproject_id(projectEntity);
                            credential.setUsername(credDTO.getUsername());
                            credential.setPassword(credDTO.getPassword());

                            credentialRepository.save(credential);
                        }
                    }
                }
            }
        }

        return projectEntity.getId();
    }

    public void saveProjectFiles(Long prid, MultipartFile... files) throws IOException {
        if (files == null || files.length == 0) return;
        Project projectEntity = projectRepository.findById(prid)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + prid));

        String manualRepoName = projectEntity.getmanula_repo();
        System.out.println(manualRepoName+"repository from DB");
        String basePath = System.getenv("FILE_STORAGE_BASE_PATH");
        if (basePath == null || basePath.isBlank()) {
            basePath = "/host_storage"; // fallback
        }
        System.out.println(basePath+"base path from container");
        Path targetDir = Paths.get(basePath, manualRepoName);

        System.out.println(targetDir+"target DIR from Container");
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }

        for (MultipartFile file : files) {
            Path filePath = targetDir.resolve(file.getOriginalFilename());
            file.transferTo(filePath.toFile());
        }
    }

    public void notifyThirdParty(Long projectId, String token) {
        String url = appProperties.getThirdPartyApiUrl();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("project_id", String.valueOf(projectId));

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        System.out.println("Third-party response: " + response.getBody());
    }

}
