package com.petallergy.model;

import java.time.Instant;

public class TreatmentLog {
    private int treatmentLogId;
    private int petId;
    private int treatmentId;
    private String dosage;
    private String notes;
    private Instant administeredAt;

    // Joined fields (for display)
    private String treatmentName;
    private String treatmentType;

    public TreatmentLog() {}

    public int getTreatmentLogId() { return treatmentLogId; }
    public void setTreatmentLogId(int treatmentLogId) { this.treatmentLogId = treatmentLogId; }

    public int getPetId() { return petId; }
    public void setPetId(int petId) { this.petId = petId; }

    public int getTreatmentId() { return treatmentId; }
    public void setTreatmentId(int treatmentId) { this.treatmentId = treatmentId; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getAdministeredAt() { return administeredAt; }
    public void setAdministeredAt(Instant administeredAt) { this.administeredAt = administeredAt; }

    public String getTreatmentName() { return treatmentName; }
    public void setTreatmentName(String treatmentName) { this.treatmentName = treatmentName; }

    public String getTreatmentType() { return treatmentType; }
    public void setTreatmentType(String treatmentType) { this.treatmentType = treatmentType; }
}
