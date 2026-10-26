package threesixty.logica.DTO;

public class UserCreateDTO {
    private String username;
    private String password;
    private String userDisplayName;
    private String apiKey;
    private int role;
    private boolean enabled;

    // Constructors
    public UserCreateDTO() {}

    public UserCreateDTO(String username, String password, String userDisplayName, String apiKey) {
        this.username = username;
        this.password = password;
        this.userDisplayName = userDisplayName;
        this.apiKey = apiKey;
        this.role = 2;
        this.enabled = true;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUserDisplayName() {
        return userDisplayName;
    }

    public void setUserDisplayName(String userDisplayName) {
        this.userDisplayName = userDisplayName;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public int getRole() {
        return role;
    }

    public void setRole(int role) {
        this.role = role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}