package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.petallergy.config.DatabaseConfig;
import com.petallergy.model.Pet;
import org.bson.Document;

import java.time.*;
import java.util.*;

public class PetDao {

    private final MongoCollection<Document> usersCol;

    public PetDao(MongoDatabase db) {
        this.usersCol = db.getCollection("users");
    }

    public List<Pet> findByUserId(int userId) {
        Document userDoc = usersCol.find(Filters.eq("_id", userId)).first();
        if (userDoc == null) return new ArrayList<>();
        List<Document> petsArray = userDoc.getList("pets", Document.class);
        if (petsArray == null) return new ArrayList<>();
        List<Pet> pets = new ArrayList<>();
        for (Document petDoc : petsArray) {
            pets.add(mapPetDoc(petDoc, userId));
        }
        pets.sort(Comparator.comparing(Pet::getName));
        return pets;
    }

    public Pet findById(int petId) {
        Document userDoc = usersCol.find(
            Filters.elemMatch("pets", Filters.eq("_id", petId))
        ).first();
        if (userDoc == null) return null;
        int userId = userDoc.getInteger("_id");
        List<Document> petsArray = userDoc.getList("pets", Document.class);
        if (petsArray == null) return null;
        return petsArray.stream()
            .filter(p -> Integer.valueOf(petId).equals(p.getInteger("_id")))
            .map(p -> mapPetDoc(p, userId))
            .findFirst().orElse(null);
    }

    public Pet insert(Pet pet) {
        int id = DatabaseConfig.getNextId("pets");
        pet.setPetId(id);
        pet.setCreatedAt(Instant.now());

        Document petDoc = new Document("_id", id)
            .append("name", pet.getName())
            .append("species", pet.getSpecies())
            .append("breed", pet.getBreed())
            .append("date_of_birth", pet.getDateOfBirth() != null
                ? Date.from(pet.getDateOfBirth().atStartOfDay(ZoneOffset.UTC).toInstant()) : null)
            .append("created_at", Date.from(pet.getCreatedAt()));

        usersCol.updateOne(
            Filters.eq("_id", pet.getUserId()),
            Updates.push("pets", petDoc)
        );
        return pet;
    }

    public Pet update(Pet pet) {
        usersCol.updateOne(
            Filters.and(
                Filters.eq("_id", pet.getUserId()),
                Filters.elemMatch("pets", Filters.eq("_id", pet.getPetId()))
            ),
            Updates.combine(
                Updates.set("pets.$.name", pet.getName()),
                Updates.set("pets.$.species", pet.getSpecies()),
                Updates.set("pets.$.breed", pet.getBreed()),
                Updates.set("pets.$.date_of_birth", pet.getDateOfBirth() != null
                    ? Date.from(pet.getDateOfBirth().atStartOfDay(ZoneOffset.UTC).toInstant()) : null)
            )
        );
        return pet;
    }

    public boolean delete(int petId) {
        Document userDoc = usersCol.find(
            Filters.elemMatch("pets", Filters.eq("_id", petId))
        ).first();
        if (userDoc == null) return false;
        int userId = userDoc.getInteger("_id");
        return usersCol.updateOne(
            Filters.eq("_id", userId),
            Updates.pull("pets", new Document("_id", petId))
        ).getModifiedCount() > 0;
    }

    private Pet mapPetDoc(Document petDoc, int userId) {
        Pet p = new Pet();
        p.setPetId(petDoc.getInteger("_id"));
        p.setUserId(userId);
        p.setName(petDoc.getString("name"));
        p.setSpecies(petDoc.getString("species"));
        p.setBreed(petDoc.getString("breed"));
        Date dob = petDoc.getDate("date_of_birth");
        if (dob != null) p.setDateOfBirth(dob.toInstant().atZone(ZoneOffset.UTC).toLocalDate());
        Date ca = petDoc.getDate("created_at");
        if (ca != null) p.setCreatedAt(ca.toInstant());
        return p;
    }
}
