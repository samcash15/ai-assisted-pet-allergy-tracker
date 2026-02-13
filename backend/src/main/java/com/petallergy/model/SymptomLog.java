package com.petallergy.model;

import java.time.Instant;

public class SymptomLog {
    private int symptomLogId;
    private int petId;
    private int symptomTypeId;
    private int severity;
    private String notes;
    private Instant loggedAt;

    // Joined fields (for display)
    private String symptomTypeName;

    public SymptomLog() {}

    public int getSymptomLogId() { return symptomLogId; }
    public void setSymptomLogId(int symptomLogId) { this.symptomLogId = symptomLogId; }

    public int getPetId() { return petId; }
    public void setPetId(int petId) { this.petId = petId; }

    public int getSymptomTypeId() { return symptomTypeId; }
    public void setSymptomTypeId(int symptomTypeId) { this.symptomTypeId = symptomTypeId; }

    public int getSeverity() { return severity; }
    public void setSeverity(int severity) { this.severity = severity; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getLoggedAt() { return loggedAt; }
    public void setLoggedAt(Instant loggedAt) { this.loggedAt = loggedAt; }

    public String getSymptomTypeName() { return symptomTypeName; }
    public void setSymptomTypeName(String symptomTypeName) { this.symptomTypeName = symptomTypeName; }
}
