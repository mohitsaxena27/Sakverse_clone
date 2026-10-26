package threesixty.logica.controller;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;


public class FeatureFileParser {

    public static void main(String[] args) throws IOException {

        String featureFilePath = "C:\\Users\\ashwanis\\Downloads\\spring_security_Part_2-master\\projects\\360Logica\\src\\test\\resources\\FeatureFile";
        FeatureFileParser fdata=new FeatureFileParser();
        List<FeatureData> Featurecollecto=fdata.Featurecollector(featureFilePath);
        for (FeatureData f1:Featurecollecto) {
           // System.out.println("******** Starting of Feature");
            System.out.println(f1.getTags());
            System.out.println(f1.getName() + ":" + f1.getlinenumber());
        for (ScenarioData name : f1.getScenarios()) {
           // System.out.println("******** Starting of Scenario");
            System.out.println(name.gettags());
            System.out.println("->"+name.getname() + ":" + name.getlinenumber());
            for (StepData step : name.getSteps()) {
                System.out.println("->>"+step.getstepname());
                for (String data : step.getData()) {

                        System.out.println("->>>" + data);


                }
            }
            if (name.getExamples().size() != 0) {
                System.out.println("******** Example of Sceario named as " + name.getname());
                System.out.println(name.getexmapleheader());

                for (Map<String, String> data : name.getExamples()) {

                    data.forEach((k, v) -> {
                        System.out.println("->"+k+":"+v);
                    });
                }
            }
            System.out.println("******** End of Scenario\n\n");
        }
          //  System.out.println("******** Ending of Feature");
        }
    }

    protected List<FeatureData> Featurecollector(String rootDirectoryPath) {
        List<FeatureData> allfeature = new ArrayList<>();
        try {
            Files.walkFileTree(Paths.get(rootDirectoryPath), EnumSet.noneOf(FileVisitOption.class), Integer.MAX_VALUE, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path filePath, BasicFileAttributes attrs) throws IOException {
                    if (filePath.toString().endsWith(".feature")) {
                        allfeature.add(readFeatureFile(filePath.toString()));
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
           // System.out.println(e.getMessage());
        }

        return allfeature;
    }
    public static FeatureData readFeatureFile(String filePath) throws IOException {
        String featureFilePath = filePath;
        BufferedReader br = new BufferedReader(new FileReader(featureFilePath));
        String line;
        int linenumber = 0;
        String currentcontext = "";
        StringBuilder currentscenariotags = new StringBuilder();
        String examplecontext = "";
        FeatureData f = new FeatureData();
        StepData sd = null;
        ScenarioData s = null;
        String lastannotation="";
        while ((line = br.readLine()) != null) {
            line = line.trim();
            linenumber = linenumber + 1;
            if (line.startsWith("@") && currentcontext.equals("")) {
                if(f.getTags()!=null) {
                    f.setTags(f.getTags() + " " + line);
                }
                else
                {
                    f.setTags(line);
                }
                examplecontext = "no";
                continue;
            }
            if (line.startsWith("@") && currentcontext.equals("feature")) {

                currentscenariotags.append(" ").append(line);
                currentcontext = "feature";
                examplecontext = "no";
            }
            if (line.startsWith("Feature:")) {

                f.setName(line.replace("Feature:", "").trim());
                f.setType("feature");
                f.setlinenumber(featureFilePath + ":" + linenumber);
                examplecontext = "no";
                currentcontext = "feature";
                lastannotation="feature";
            } else if (line.startsWith("Scenario:")) {
                s = new ScenarioData();
                s.setTags(currentscenariotags.toString());
                s.setlinenumber(featureFilePath + ":" + linenumber);
                currentscenariotags = new StringBuilder();
                s.setName(line.replace("Scenario:", "").trim());
                f.getScenarios().add(s);
                examplecontext = "no";
                lastannotation="scenario";
            } else if (line.startsWith("Scenario Outline:")) {
                s = new ScenarioData();
                s.setTags(currentscenariotags.toString());
                s.setlinenumber(featureFilePath + ":" + linenumber);
                currentscenariotags = new StringBuilder();
                s.setName(line.replace("Scenario Outline:", "").trim());
                f.getScenarios().add(s);
                examplecontext = "no";
                lastannotation="scenariooutline";
            } else if (line.startsWith("Given") || line.startsWith("When") || line.startsWith("Then") || line.startsWith("And") || line.startsWith("But") || line.startsWith("Or")) {
                if(lastannotation.equals("scenariooutline")||lastannotation.equals("scenario")||lastannotation.equals("steps")||lastannotation.equals("stepsdata")) {
                    sd = new StepData();
                    sd.setStepName(line);
                    s.getSteps().add(sd);
                    examplecontext = "no";
                }
                lastannotation="steps";

            } else if (line.startsWith("|")) {
                if(lastannotation.equals("steps")||lastannotation.equals("stepsdata")){
                if (examplecontext.equals("no")) {
                    String[] data = line.split("\\|");
                    List<String> rowData = new ArrayList<>();
//                    for (int i = 0; i < data.length; i++) {
//                        rowData.add(data[i]);
//                    }
                    rowData.add(line);
                    sd.getData().add(line);
                    lastannotation="stepsdata";
                }
                } else {
                    if(lastannotation.equals("example")) {
//                        Map<String, String> myMap = new HashMap<String, String>();
//                        myMap.put(line, featureFilePath + ":" + linenumber);
                            s.setexmapleheader(line);

                    }
                    else {
                        Map<String, String> myMap = new HashMap<String, String>();
                        myMap.put(line, featureFilePath + ":" + linenumber);
                        s.getExamples().add(myMap);
                    }
                    lastannotation="exampledata";
                }
            } else if (line.startsWith("Examples:")) {

                if(s.getExamples()==null) {
                    s.setExamples("Startting of Example", featureFilePath + ":" + linenumber);
                }
                examplecontext = "yes";
                lastannotation="example";
            } else if (line.startsWith("#")) {
                //System.out.println("these are comments");
            }
        }


        // Replace with the actual file path
        // String jsonResponse = readFeatureFile(featureFilePath);
        //System.out.println();
//        System.out.println(f.getTags());
//        System.out.println(f.getName() + ":" + f.getlinenumber());
//        for (org.example.webportal.controller.ScenarioData name : f.getScenarios()) {
//            System.out.println("******** Starting of Scenario");
//            System.out.println(name.gettags());
//            System.out.println(name.getname() + ":" + name.getlinenumber());
//            for (org.example.webportal.controller.StepData step : name.getSteps()) {
//                System.out.println(step.getstepname());
//                for (List data : step.getData()) {
//                    System.out.println(data.toArray());
//
//                }
//            }
//            if (name.getExamples().size() != 0) {
//                System.out.println("******** Example of Sceario named as " + name.getname());
//                for (Map<String, String> data : name.getExamples()) {
//
//                    data.forEach((k, v) -> {
//                        System.out.println(k + ":" + v);
//                    });
//                }
//            }
//            System.out.println("******** End of Scenario");
//        }
        return f;
    }
}
    class FeatureData {
        private String name;
        private String type;
        private String tags;
        private String linenu;
        private List<ScenarioData> scenarios = new ArrayList<>();

        public void setName(String trim) {
            name = trim;
        }

        public String getType() {
            return type;
        }

        public String getName() {
            return name;
        }

        public void setType(String feature) {
            type = feature;
        }

        public Collection<ScenarioData> getScenarios() {
            return scenarios;
        }

        public void setTags(String line) {
            tags = line;
        }

        public void setlinenumber(String linenumber) {
            linenu = linenumber;
        }

        public String getTags() {
            return tags;
        }

        public String getlinenumber() {
            return linenu;
        }

        // Getters and setters
    }

    class ScenarioData {
        private String linenum;
        private String type;
        private String name;
        private String tags;
        private List<StepData> steps = new ArrayList<>();
        //private List<String> examples = new ArrayList<>();
        private List<Map<String, String>> examples
                = new ArrayList<>();
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

   class StepData {
        private String stepName;
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

class ExampleData {
    private String Headerrow;
    private String linenumber;
    private String Data;
    private String header;


    // Getters and setters
}
class project {
    private String name;

    public void setName(String trim) {
        name = trim;
    }

    public String getName() {
        return name;
    }

    // Getters and setters
}
