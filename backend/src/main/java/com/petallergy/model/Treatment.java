package com.petallergy.model;

public class Treatment {
    private int treatmentId;
    private String name;
    private String treatmentType;
    private String description;

    public Treatment() {}

    public int getTreatmentId() { return treatmentId; }
    public void setTreatmentId(int treatmentId) { this.treatmentId = treatmentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTreatmentType() { return treatmentType; }
    public void setTreatmentType(String treatmentType) { this.treatmentType = treatmentType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
