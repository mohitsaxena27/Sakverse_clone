package threesixty.logica.DTO;


import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.*;

class ScenarioData {
    @JsonProperty("linenum")
    private String linenum;
    @JsonProperty("type")
    private String type;
    @JsonProperty("scenarioname")
    private String name;
    @JsonProperty("tags")
    private String tags;
    @JsonProperty("steps")
    private List<StepData> steps = new ArrayList<>();
    //private List<String> examples = new ArrayList<>();
    @JsonProperty("examples")
    private List<Map<String, String>> examples
            = new ArrayList<>();
    @JsonProperty("examplesheader")
    private String exampleheader;
    public void setName(String trim) {
        name = trim;
    }

    public Collection<StepData> getSteps() {
        return steps;
    }

    public void setExamples(String name, String line) {
        Map<String, String> myMap = new HashMap<String, String>();
        myMap.put(name, line);
        examples.add(myMap);
    }

    public void setexmapleheader(String line) {
        exampleheader=line;
    }
    public String getexmapleheader() {
        return exampleheader;
    }

    public List<Map<String, String>> getExamples() {
        return examples;
    }

    public void setTags(String trim) {
        tags = trim;
    }

    public String getname() {
        return name;
    }

    public String getlinenumber() {
        return linenum;
    }

    public String gettype() {
        return type;
    }

    public String gettags() {
        return tags;
    }

    public void setlinenumber(String linenumber) {
        linenum = linenumber;
    }

    // Getters and setters
}
