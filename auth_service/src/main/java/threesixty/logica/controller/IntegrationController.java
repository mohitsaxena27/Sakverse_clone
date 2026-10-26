package threesixty.logica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import threesixty.logica.DTO.ProjectAssignmentResponse;
import threesixty.logica.DTO.ProjectIntegrationDTO;
import threesixty.logica.model.Project_integartion;
import threesixty.logica.model.User;
import threesixty.logica.repository.IntegrationRepository;
import threesixty.logica.service.AuthService;
import threesixty.logica.service.ProjectAssignmentService;
import threesixty.logica.service.ProjectIntegrationService;
import threesixty.logica.util.JwtUtil;

import java.util.List;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private IntegrationRepository integrationRepository;
    @Autowired
    private AuthService authService;
    @Autowired
    private ProjectIntegrationService projectIntegrationService;
    // Get all integrations
//    @GetMapping
//    public List<Project_integartion> getAllIntegrations() {
//        return integrationRepository.findAll();
//    }

    // Get integrations by project ID
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ProjectIntegrationDTO>> getIntegrationsByProjectId(@RequestHeader("Authorization") String token,@PathVariable Long projectId) {
        try {
            // Remove the "Bearer " prefix if present
            System.out.println("***************" + token + "*****************");
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            String username = jwtUtil.extractUsername(token);
            System.out.println("******here is the extracted*********" + username + "*****************");
            if (jwtUtil.validateToken(token, username)) {
                User user = authService.getuser(username);
                System.out.println("***************" + username + "*****************");
                System.out.println("***************" + user.getUserId() + "*****************");
                List<ProjectIntegrationDTO> prject_integration = projectIntegrationService.getIntegrations(projectId,user.getUserId());
                System.out.println("*******This is the Actual List********" + prject_integration + "*****************");
                return ResponseEntity.ok(prject_integration);
            } else {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
        }
        catch (Exception e) {
            System.out.println("***************" + e + "*****************");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }

    }


    @GetMapping("/project/{projectId}/{type}")
    public ResponseEntity<ProjectIntegrationDTO> getIntegrationsByProjecttype(@RequestHeader("Authorization") String token,@PathVariable Long projectId,@PathVariable String type) {
        try {
            // Remove the "Bearer " prefix if present
            System.out.println("***************" + token + "*****************");
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            String username = jwtUtil.extractUsername(token);
            System.out.println("******here is the extracted*********" + username + "*****************");
            if (jwtUtil.validateToken(token, username)) {
                User user = authService.getuser(username);
                System.out.println("***************" + username + "*****************");
                System.out.println("***************" + user.getUserId() + "*****************");
                ProjectIntegrationDTO prject_integration = projectIntegrationService.getIntegrationbyType(projectId,user.getUserId(),type);
                System.out.println("*******This is the Actual List********" + prject_integration + "*****************");
                return ResponseEntity.ok(prject_integration);
            } else {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
        }
        catch (Exception e) {
            System.out.println("***************" + e + "*****************");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }

    }

}
