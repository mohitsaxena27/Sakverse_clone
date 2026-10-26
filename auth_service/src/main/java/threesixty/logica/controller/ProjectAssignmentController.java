package threesixty.logica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.json.MappingJacksonValue;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import threesixty.logica.DTO.ProjectAssignmentResponse;
import threesixty.logica.DTO.ProjectIntegrationDTO;
import threesixty.logica.Views;
import threesixty.logica.model.User;
import threesixty.logica.repository.IntegrationRepository;
import threesixty.logica.repository.UserRepository;
import threesixty.logica.service.AuthService;
import threesixty.logica.service.ProjectAssignmentService;
import threesixty.logica.service.ProjectIntegrationService;
import threesixty.logica.util.JwtUtil;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProjectAssignmentController {

    @Autowired
    private ProjectAssignmentService projectAssignmentService;
    @Autowired
    private AuthService authService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private IntegrationRepository integrationRepository;
    @Autowired
    private ProjectIntegrationService projectIntegrationService;
    // GET API to fetch all assigned projects, role, and permissions
    @GetMapping("/assigned-projects")
    public ResponseEntity<MappingJacksonValue> getAssignedProjects(@RequestHeader("Authorization") String token) {
        // Get username from the authenticated token
        try {
            // Remove the "Bearer " prefix if present
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            String username = jwtUtil.extractUsername(token);
            if (jwtUtil.validateToken(token, username)) {
                User user = authService.getuser(username);
                System.out.println("******12*********" + username + "*****************");
                System.out.println("********132*******" + user.getUserId() + "*****************");
                List<ProjectAssignmentResponse> assignedProjects = projectAssignmentService.getAssignedProjects(user.getUserId());
                for (ProjectAssignmentResponse project : assignedProjects) {
//                    try {
                        Long projectId = project.getproject_id();
                        List<ProjectIntegrationDTO> integrations = projectIntegrationService.getIntegrations(projectId, user.getUserId());
                        project.setIntegrations(integrations);
//                    }
//                 catch(Exception ex){
//                    System.out.println("Failed to fetch integrations for projectId: " + project.getproject_id());
//                    ex.printStackTrace();  // See exact cause
//                }
            }
                MappingJacksonValue wrapper = new MappingJacksonValue(assignedProjects);
                wrapper.setSerializationView(Views.Public.class); // excludes url/username/password

                return ResponseEntity.ok(wrapper);
//                List<ProjectIntegrationDTO> prject_integration = projectIntegrationService.getIntegrations(projectId,user.getUserId());
//                System.out.println("*******This is the Actual List********"+assignedProjects+"*****************");
//                return ResponseEntity.ok(assignedProjects);
            } else {
                System.out.println("******Something here is failing**********");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
        }
        catch (Exception e) {
            System.out.println("******Something here is failing - 345**********");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
    }



        // Fetch assigned projects with roles and permissions

    }

