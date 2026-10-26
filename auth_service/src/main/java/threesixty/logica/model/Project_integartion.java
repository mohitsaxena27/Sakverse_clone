package threesixty.logica.model;

import threesixty.logica.util.JsonToMapConverter;

import javax.persistence.*;
import java.util.Map;

@Entity
@Table(name = "integrations")
public class Project_integartion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type", nullable = false)
    private String type;
    @Column(name = "url", nullable = false)
    private String url;
    @Column(name = "enable", nullable = false)
    private Boolean enable; // e.g., "True", "False"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id",referencedColumnName = "id", nullable = false)
    private Project project;
//    @JoinColumn(name = "llm_model",referencedColumnName = "llm_model", nullable = false)
//    private Project llm_model;
    @Column(name = "tool", nullable = false)
    private String tool;

    @Convert(converter = JsonToMapConverter.class)
    @Column(name = "additional_config",  nullable = true) // or JSONB if using PostgreSQL
    private Map<String, Object> additional_config;


//    // Default constructor
    public Project_integartion() {}

    // Constructor with parameters
    public Project_integartion(String type, Boolean enable, String url,String tool,Map<String, Object> config,Project pr) {
        this.type = type;
        this.enable=enable;
        this.url=url;
        this.tool=tool;
        this.additional_config=config;
        this.project=pr;

    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getpr_id() {
        return project;
    }

    public void setpr_id(Project pid) {
        this.project = pid;
    }



    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getURL() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Boolean getEnable() {
        return enable;
    }

    public void setEnable(Boolean link) {
        this.enable = link;
    }
    public String gettool() {
        return tool;
    }

    public void settool(String tool) {
        this.tool = tool;
    }
    public void setConfig(Map<String, Object> config) {
        this.additional_config= config;
    }
    public Map<String, Object> getConfig(String tool) {
        return this.additional_config;
    }

}
