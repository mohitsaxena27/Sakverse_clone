package threesixty.logica.DTO;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

class StepData {
    @JsonProperty("stepname")
    private String stepName;
    @JsonProperty("stepdata")
    private List<String> data = new ArrayList<>();

    public void setStepName(String line) {
        stepName = line;
    }

    public List<String> getData() {
        return data;
    }

    public int getDatacount() {
        return data.size();
    }

    public String getstepname() {
        return stepName;
    }

    // Getters and setters
}
