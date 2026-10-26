package threesixty.logica.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class FeatureListResponse {
    @JsonProperty("featurename")
    private String name;
    @JsonProperty("type")
    private String type;
    @JsonProperty("tags")
    private String tags;
    @JsonProperty("linenumber")
    private String linenu;
    @JsonProperty("scenarios")
    private List<ScenarioData> scenarios = new ArrayList<>();



//    @JsonProperty("permissions")
//    private Permissions permissions;

    public FeatureListResponse(
            String featurename,String type,String tags,String linenumber,List<ScenarioData> scenarios
            )
    {this.name=featurename;
    this.type=type;
    this.tags=tags;
   this.linenu=linenumber;
    this.scenarios=scenarios;
//    this.permissions=permissions;


    }
    // Getters and Setters...
}
