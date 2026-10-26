package threesixty.logica.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import threesixty.logica.model.User;
import threesixty.logica.util.JwtUtil;
import threesixty.logica.service.AuthService;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://tcg.saksoft.com:5175/")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        User user = authService.authenticate(username, password);

        if (user != null) {
            String token = jwtUtil.generateToken(username,user.getRole());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("displayName", user.getUserDisplayName());
//            response.put("role", user.getuserrole());
//            response.put("Project", user.project());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Invalid username or password");
        }
    }

//    @GetMapping("/user")
//    public ResponseEntity<?> getdetails(@RequestHeader("Authorization") String token) {
//        String providedtoken = token.substring(7);
//
//        // Validate token
//        if (!jwtUtil.validateToken(providedtoken)) {
//            throw new IllegalArgumentException("Invalid token");
//        }
//        String username = jwtUtil.extractUsername(token);
//
//        // Fetch user details from DB
//        User user = userService.getUserByUsername(username);
//
//
//    }
}
