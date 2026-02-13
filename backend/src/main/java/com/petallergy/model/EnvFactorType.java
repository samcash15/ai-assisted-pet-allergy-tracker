package com.petallergy.model;

public class EnvFactorType {
    private int envFactorTypeId;
    private String name;
    private String unit;
    private String description;

    public EnvFactorType() {}

    public int getEnvFactorTypeId() { return envFactorTypeId; }
    public void setEnvFactorTypeId(int envFactorTypeId) { this.envFactorTypeId = envFactorTypeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
