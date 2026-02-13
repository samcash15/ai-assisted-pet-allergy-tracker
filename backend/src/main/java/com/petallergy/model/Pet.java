package com.petallergy.model;

import java.time.Instant;
import java.time.LocalDate;

public class Pet {
    private int petId;
    private int userId;
    private String name;
    private String species;
    private String breed;
    private LocalDate dateOfBirth;
    private Instant createdAt;

    public Pet() {}

    public int getPetId() { return petId; }
    public void setPetId(int petId) { this.petId = petId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
