package com.petallergy.model;

public class SymptomType {
    private int symptomTypeId;
    private String name;
    private String description;

    public SymptomType() {}

    public int getSymptomTypeId() { return symptomTypeId; }
    public void setSymptomTypeId(int symptomTypeId) { this.symptomTypeId = symptomTypeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
