package com.petallergy.model;

import java.math.BigDecimal;
import java.time.Instant;

public class EnvFactorLog {
    private int envFactorLogId;
    private int petId;
    private int envFactorTypeId;
    private BigDecimal value;
    private String notes;
    private Instant loggedAt;

    // Joined fields (for display)
    private String envFactorTypeName;
    private String envFactorTypeUnit;

    public EnvFactorLog() {}

    public int getEnvFactorLogId() { return envFactorLogId; }
    public void setEnvFactorLogId(int envFactorLogId) { this.envFactorLogId = envFactorLogId; }

    public int getPetId() { return petId; }
    public void setPetId(int petId) { this.petId = petId; }

    public int getEnvFactorTypeId() { return envFactorTypeId; }
    public void setEnvFactorTypeId(int envFactorTypeId) { this.envFactorTypeId = envFactorTypeId; }

    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getLoggedAt() { return loggedAt; }
    public void setLoggedAt(Instant loggedAt) { this.loggedAt = loggedAt; }

    public String getEnvFactorTypeName() { return envFactorTypeName; }
    public void setEnvFactorTypeName(String envFactorTypeName) { this.envFactorTypeName = envFactorTypeName; }

    public String getEnvFactorTypeUnit() { return envFactorTypeUnit; }
    public void setEnvFactorTypeUnit(String envFactorTypeUnit) { this.envFactorTypeUnit = envFactorTypeUnit; }
}
