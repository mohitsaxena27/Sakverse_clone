package threesixty.logica.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import threesixty.logica.Views;

import java.util.List;

public class ProjectAssignmentResponse {

    @JsonProperty("project_id")
    @JsonView(Views.Public.class)
    private Long projectId;

    @JsonProperty("project_name")
    @JsonView(Views.Public.class)
    private String projectName;

    @JsonProperty("project_type")
    @JsonView(Views.Public.class)
    private String projectType;

    @JsonProperty("role")
    @JsonView(Views.Public.class)
    private String role;
    @JsonProperty("linked")
    @JsonView(Views.Public.class)
    private Boolean linked;
//    private List<ProjectIntegrationDTO> integrations;
    @JsonProperty("integration")
    @JsonView(Views.Public.class)
    private List<ProjectIntegrationDTO> integrations;
    public ProjectAssignmentResponse(
            Long prid,String name,String type,String getRoleName,Boolean link
            )
    {this.projectId=prid;
    this.projectName=name;
    this.projectType=type;
   this.linked=link;
    this.role=getRoleName;


    }
    public List<ProjectIntegrationDTO> getIntegrations() {
        return integrations;
    }


    public Long getproject_id() {
    return projectId;
    }
    public String getproject_type() {
        return projectType;
    }

    public void setIntegrations(List<ProjectIntegrationDTO> integrations) {
        this.integrations=integrations;
    }
}
