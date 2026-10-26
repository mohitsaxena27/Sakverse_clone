package threesixty.logica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import threesixty.logica.DTO.ProjectCreateDTO;
import threesixty.logica.DTO.UserCreateDTO;
import threesixty.logica.model.User;
import threesixty.logica.service.AdminService;
import threesixty.logica.service.AdminServices;
import threesixty.logica.service.AuthService;
import threesixty.logica.util.JwtUtil;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
// Class-level security
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AdminServices adminServices;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private AuthService authService;
//    @PostMapping("/projects")
//    public ResponseEntity<Object> createProject(@RequestHeader("Authorization") String token ,@RequestBody ProjectCreateDTO projectDTO){
//        String providedtoken = token.substring(7);
//
//        String username=jwtUtil.extractUsername(providedtoken);
//        if (!jwtUtil.validateToken(providedtoken,username)) {
//            throw new IllegalArgumentException("Invalid token");
//        }
////        String username = jwtUtil.extractUsername(token);
////
////        // Fetch user details from DB
//        User user=authService.getuser(username);
//        if(user.getRole()==1) {
//            Long projectId = adminService.createProject(projectDTO);
//            return ResponseEntity.ok().body(Map.of("projectid", projectId));
//        }
//        else {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                    .body(Map.of("error", "Unauthorized access"));
//        }
//    }


@PostMapping("/projects")
public ResponseEntity<Object> createProject(
        @RequestHeader("Authorization") String token,
        @RequestBody ProjectCreateDTO projectDTO) {

    // Extract token and validate
    String providedToken = token.substring(7);
    String username = jwtUtil.extractUsername(providedToken);
    if (!jwtUtil.validateToken(providedToken, username)) {
        throw new IllegalArgumentException("Invalid token");
    }

    // Fetch user from DB
    User user = authService.getuser(username);

    if (user.getRole() != 1) { // Only admin can create projects
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unauthorized access"));
    }

    // Call service to create project and all nested entities
    Long projectId = adminService.createProject(projectDTO);

    return ResponseEntity.ok(Map.of("projectid", projectId));
}


    @PostMapping(path = "/projectOnboarding",consumes = {"multipart/form-data"})
    public ResponseEntity<Object> onboardingProject(
            @RequestHeader("Authorization") String token,
            @RequestPart("data") ProjectCreateDTO projectDTO,
            @RequestPart("files") MultipartFile[] files) throws IOException {

        // Extract token and validate
        String providedToken = token.substring(7);
        String username = jwtUtil.extractUsername(providedToken);
        if (!jwtUtil.validateToken(providedToken, username)) {
            throw new IllegalArgumentException("Invalid token");
        }

        // Fetch user from DB
        User user = authService.getuser(username);

        if (user.getRole() != 1) { // Only admin can create projects
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access"));
        }

        // Call service to create project and all nested entities
        Long projectId = adminServices.createProjectWithDetails(projectDTO);
        adminServices.saveProjectFiles(projectId, files);
        adminServices.notifyThirdParty(projectId, token.substring(7));

        return ResponseEntity.ok(Map.of("projectId", projectId));

//        return ResponseEntity.ok(Map.of("projectid", projectId));
//        return ResponseEntity.ok(Map.of("projectid", projectId));
    }


    @PostMapping("/users")
    public ResponseEntity<Object> createUser(@RequestHeader("Authorization") String token ,@RequestBody UserCreateDTO userDTO) {
        String providedtoken = token.substring(7);

        String username=jwtUtil.extractUsername(providedtoken);
        if (!jwtUtil.validateToken(providedtoken,username)) {
            throw new IllegalArgumentException("Invalid token");
        }
        User user=authService.getuser(username);
        if(user.getRole()==1) {
            Long userId = adminService.createUser(userDTO);
            return ResponseEntity.ok().body(Map.of("userid", userId));
        }
        else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access"));
        }
    }

    @PostMapping("/assignments")
    public ResponseEntity<Object> assignUserToProject(
            @RequestHeader("Authorization") String token ,
            @RequestParam Long userId,
            @RequestParam Long projectId) {
        String providedtoken = token.substring(7);

        String username=jwtUtil.extractUsername(providedtoken);
        if (!jwtUtil.validateToken(providedtoken,username)) {
            throw new IllegalArgumentException("Invalid token");
        }
        User user=authService.getuser(username);
        if(user.getRole()==1) {
            adminService.assignUserToProject(userId, projectId, 2);
            return ResponseEntity.ok().body(Map.of("message", "Success"));
        }
        else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized access"));
        }
    }
    @GetMapping("/llm-key")
    public ResponseEntity<Object> getLlmKey(@RequestHeader("Authorization") String token) {
        try {
            String providedToken = token.substring(7);
            String username = jwtUtil.extractUsername(providedToken);

            if (!jwtUtil.validateToken(providedToken, username)) {
                throw new IllegalArgumentException("Invalid token");
            }

            User user = authService.getuser(username);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            String llmKey = user.getLlm_key();
            if (llmKey == null || llmKey.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "LLM key not found for user"));
            }

            return ResponseEntity.ok()
                    .body(Map.of("llm_key", llmKey));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred while fetching the LLM key"));
        }
    }


}