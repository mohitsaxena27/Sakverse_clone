package threesixty.logica.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import threesixty.logica.Views;

import java.util.Map;

public class ProjectIntegrationDTO {

    @JsonProperty("project_id")
    @JsonView(Views.Public.class)
    private Long projectId;

    @JsonProperty("type")
    @JsonView(Views.Public.class)
    private String type;

    @JsonProperty("url")
    @JsonView(Views.Internal.class)
    private String url;

    @JsonProperty("enabled")
    @JsonView(Views.Public.class)
    private Boolean enabled;

    @JsonProperty("username")
    @JsonView(Views.Internal.class)
    private String username;

    @JsonProperty("password")
    @JsonView(Views.Internal.class)
    private String password;

    @JsonProperty("tool")
    @JsonView(Views.Public.class)
    private String tool;

    @JsonProperty("llm_model")
    @JsonView(Views.Internal.class)
    private String llm_model;

    @JsonProperty("config")
    @JsonView(Views.Public.class)
    private Map<String, Object> additional_config;

//    @JsonProperty("permissions")
//    private Permissions permissions;

    public ProjectIntegrationDTO(Long prid, String type, String url, Boolean enabled, String tool, String username, String password, String llm_model, Map<String, Object> config)
    {   this.projectId=prid;
        this.type=type;
        this.url=url;
        this.enabled=enabled;
        this.username = username;
        this.password = password;
        this.tool = tool;
        this.llm_model=llm_model;
        this.additional_config=config;

    }
}
