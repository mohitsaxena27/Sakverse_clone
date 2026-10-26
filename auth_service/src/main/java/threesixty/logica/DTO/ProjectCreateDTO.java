package threesixty.logica.DTO;

import java.util.List;
import java.util.Map;

public class ProjectCreateDTO {
    private ProjectDTO project;

    // Constructors
    public ProjectCreateDTO() {}

    public ProjectCreateDTO(ProjectDTO project) {
        this.project = project;
    }

    // Getter and Setter
    public ProjectDTO getProject() {
        return project;
    }

    public void setProject(ProjectDTO project) {
        this.project = project;
    }



    // ================= Inner DTOs ================= //

    public static class ProjectDTO {
        private String project_name;
        private String project_type;
        private String description;
        private String manual_repo;
        private String automation_repo;
        private Boolean linked;
        private String llm_model;
        private List<IntegrationDTO> integration;
        private UsersDTO users;

        // Getters & Setters
        public String getProject_name() { return project_name; }
        public void setProject_name(String project_name) { this.project_name = project_name; }

        public String getProject_type() { return project_type; }
        public void setProject_type(String project_type) { this.project_type = project_type; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getManual_repo() { return manual_repo; }
        public void setManual_repo(String manual_repo) { this.manual_repo = manual_repo; }

        public String getAutomation_repo() { return automation_repo; }
        public void setAutomation_repo(String automation_repo) { this.automation_repo = automation_repo; }

        public Boolean getLinked() { return linked; }
        public void setLinked(Boolean linked) { this.linked = linked; }

        public String getLlm_model() { return llm_model; }
        public void setLlm_model(String llm_model) { this.llm_model = llm_model; }

        public List<IntegrationDTO> getIntegration() { return integration; }
        public void setIntegration(List<IntegrationDTO> integration) { this.integration = integration; }

        public UsersDTO getUsers() { return users; }
        public void setUsers(UsersDTO users) { this.users = users; }
    }

    public static class IntegrationDTO {
        private String type;
        private String tool;
        private Map<String, Object> additional_config;
        private String url;
        // Getters & Setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getURL() { return url; }
        public void setURL(String url) { this.url = url; }
        public String getTool() { return tool; }
        public void setTool(String tool) { this.tool = tool; }

        public Map<String, Object> getAdditional_config() { return additional_config; }
        public void setAdditional_config(Map<String, Object> additional_config) { this.additional_config = additional_config; }
    }

    public static class UsersDTO {
        private List<ExitingUserDTO> existing;
        private List<NewUserDTO> newUsers;

        // Map "new" JSON key -> newUsers (Jackson can handle with @JsonProperty)
        @com.fasterxml.jackson.annotation.JsonProperty("new")
        public List<NewUserDTO> getNewUsers() { return newUsers; }
        public void setNewUsers(List<NewUserDTO> newUsers) { this.newUsers = newUsers; }

        public List<ExitingUserDTO> getExisting() { return existing; }
        public void setExisting(List<ExitingUserDTO> existing) { this.existing = existing; }
    }



    public static class NewUserDTO {
        private String username;
        private String password;
        private String user_display_name;
        private String llm_key;
        private List<IntegrationCredentialDTO> integration_creadentials;

        // Getters & Setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getUser_display_name() { return user_display_name; }
        public void setUser_display_name(String user_display_name) { this.user_display_name = user_display_name; }

        public String getLlm_key() { return llm_key; }
        public void setLlm_key(String llm_key) { this.llm_key = llm_key; }

        public List<IntegrationCredentialDTO> getIntegration_creadentials() { return integration_creadentials; }
        public void setIntegration_creadentials(List<IntegrationCredentialDTO> integration_creadentials) {
            this.integration_creadentials = integration_creadentials;
        }
    }

    public static class ExitingUserDTO {
        private Long id;
        private List<IntegrationCredentialDTO> integration_creadentials;
        public Long getID() { return id; }
        public void setID(Long id) { this.id = id; }
        public List<IntegrationCredentialDTO> getIntegration_creadentials() { return integration_creadentials; }
        public void setIntegration_creadentials(List<IntegrationCredentialDTO> integration_creadentials) {
            this.integration_creadentials = integration_creadentials;
        }
    }

    public static class IntegrationCredentialDTO {
        private String type;
        private String username;
        private String password;

        // Getters & Setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
