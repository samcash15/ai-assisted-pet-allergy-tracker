package com.petallergy.controller;

import com.petallergy.dao.PetDao;
import com.petallergy.model.Pet;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.util.Map;

public class PetController {

    private static final int DEFAULT_USER_ID = 1;
    private final PetDao petDao;

    public PetController(PetDao petDao) {
        this.petDao = petDao;
    }

    public void registerRoutes(Javalin app) {
        app.get("/api/pets", this::listPets);
        app.post("/api/pets", this::createPet);
        app.get("/api/pets/{petId}", this::getPet);
        app.put("/api/pets/{petId}", this::updatePet);
        app.delete("/api/pets/{petId}", this::deletePet);
    }

    private void listPets(Context ctx) throws Exception {
        ctx.json(petDao.findByUserId(DEFAULT_USER_ID));
    }

    private void getPet(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        Pet pet = petDao.findById(petId);
        if (pet == null) {
            ctx.status(404).json(Map.of("error", "Pet not found"));
            return;
        }
        ctx.json(pet);
    }

    private void createPet(Context ctx) throws Exception {
        Pet pet = ctx.bodyAsClass(Pet.class);
        pet.setUserId(DEFAULT_USER_ID);
        if (pet.getName() == null || pet.getName().isBlank()) {
            ctx.status(400).json(Map.of("error", "Name is required"));
            return;
        }
        if (pet.getSpecies() == null || pet.getSpecies().isBlank()) {
            ctx.status(400).json(Map.of("error", "Species is required"));
            return;
        }
        Pet created = petDao.insert(pet);
        ctx.status(201).json(created);
    }

    private void updatePet(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        Pet existing = petDao.findById(petId);
        if (existing == null) {
            ctx.status(404).json(Map.of("error", "Pet not found"));
            return;
        }
        Pet pet = ctx.bodyAsClass(Pet.class);
        pet.setPetId(petId);
        pet.setUserId(DEFAULT_USER_ID);
        Pet updated = petDao.update(pet);
        ctx.json(updated);
    }

    private void deletePet(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        boolean deleted = petDao.delete(petId);
        if (!deleted) {
            ctx.status(404).json(Map.of("error", "Pet not found"));
            return;
        }
        ctx.status(204);
    }
}
