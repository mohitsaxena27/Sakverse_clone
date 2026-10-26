package threesixty.logica.model;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "project")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false)
    private String name;

    @Column(name = "project_type", nullable = false)
    private String type; // e.g., "Automation", "Manual", "Data"
    @Column(name = "linked", nullable = false)
    private Boolean linked; // e.g., "Automation", "Manual", "Data"

    @Column(name = "description", nullable = true)
    private String description; // e.g., "Automation", "Manual", "Data"
    @Column(name = "manual_repo", nullable = true)
    private String manual_repo; // e.g., "Automation", "Manual", "Data"
    @Column(name = "llm_model", nullable = true)
    private String llm_model;
    @Column(name = "automation_repo", nullable = false)
    private String automation_repo; // e.g., "Automation", "Manual", "Data"
//    // Default constructor
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private List<Project_integartion> integrations;
    public Project() {}

    // Constructor with parameters
    public Project(String name, String type,Boolean linked,String manual_repo,String automatoin_repo,String description,List<Project_integartion> integration,String llm_model) {
        this.name = name;
        this.type = type;
        this.linked=linked;
        this.manual_repo=manual_repo;
        this.description=description;
        this.integrations=integration;
        this.llm_model=llm_model;

        this.automation_repo=automatoin_repo;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Boolean getLink() {
        return linked;
    }

    public void setLink(Boolean link) {
        this.linked = link;
    }

    public String getmanula_repo() {
        return manual_repo;
    }

    public void setmanula_repo(String manual_repo) {
        this.manual_repo = manual_repo;
    }

    public String getdescription() {
        return description;
    }
//
    public void setdescription(String description) {
        this.description = description;
    }
//

    public List<Project_integartion> getintegration() {
        return integrations;
    }
    //
    public void setintegration(List<Project_integartion> newintegrations) {
        this.integrations = newintegrations;
    }
//
public String getllm_model() {
    return llm_model;
}
    //
    public void setllm_model(String model) {
        this.llm_model = model;
    }

    public void setAutomation_repo(String automation_repo) {
        this.automation_repo = automation_repo;
    }
//
}
