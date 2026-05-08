package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.petallergy.config.DatabaseConfig;
import com.petallergy.model.SymptomLog;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.time.Instant;
import java.util.*;

public class SymptomLogDao {

    private final MongoCollection<Document> collection;
    private final MongoCollection<Document> symptomTypesCol;
    private final MongoCollection<Document> usersCol;

    public SymptomLogDao(MongoDatabase db) {
        this.collection = db.getCollection("symptom_logs");
        this.symptomTypesCol = db.getCollection("symptom_types");
        this.usersCol = db.getCollection("users");
    }

    public List<SymptomLog> findByPetId(int petId) {
        List<SymptomLog> logs = new ArrayList<>();
        collection.find(Filters.eq("pet_id", petId))
                  .sort(Sorts.descending("logged_at"))
                  .forEach(doc -> logs.add(mapDoc(doc)));
        return logs;
    }

    public List<SymptomLog> findByPetIdAndDateRange(int petId, Instant from, Instant to) {
        Bson filter = Filters.and(
            Filters.eq("pet_id", petId),
            Filters.gte("logged_at", Date.from(from)),
            Filters.lte("logged_at", Date.from(to))
        );
        List<SymptomLog> logs = new ArrayList<>();
        collection.find(filter).sort(Sorts.descending("logged_at")).forEach(doc -> logs.add(mapDoc(doc)));
        return logs;
    }

    public SymptomLog insert(SymptomLog log) {
        int id = DatabaseConfig.getNextId("symptom_logs");
        log.setSymptomLogId(id);
        if (log.getLoggedAt() == null) log.setLoggedAt(Instant.now());

        // Denormalize type name and pet name at write time
        Document typeDoc = symptomTypesCol.find(Filters.eq("_id", log.getSymptomTypeId())).first();
        String typeName = typeDoc != null ? typeDoc.getString("name") : "";
        log.setSymptomTypeName(typeName);

        String petName = getPetName(log.getPetId());

        Document doc = new Document("_id", id)
            .append("pet_id", log.getPetId())
            .append("pet_name", petName)
            .append("symptom_type", typeName)
            .append("severity", log.getSeverity())
            .append("notes", log.getNotes())
            .append("logged_at", Date.from(log.getLoggedAt()));

        collection.insertOne(doc);
        return log;
    }

    public boolean delete(int id) {
        return collection.deleteOne(Filters.eq("_id", id)).getDeletedCount() > 0;
    }

    private String getPetName(int petId) {
        Document userDoc = usersCol.find(
            Filters.elemMatch("pets", Filters.eq("_id", petId))
        ).first();
        if (userDoc == null) return "";
        List<Document> petsArray = userDoc.getList("pets", Document.class);
        if (petsArray == null) return "";
        return petsArray.stream()
            .filter(p -> Integer.valueOf(petId).equals(p.getInteger("_id")))
            .map(p -> p.getString("name"))
            .findFirst().orElse("");
    }

    private SymptomLog mapDoc(Document doc) {
        SymptomLog sl = new SymptomLog();
        sl.setSymptomLogId(doc.getInteger("_id"));
        sl.setPetId(doc.getInteger("pet_id"));
        sl.setSeverity(doc.getInteger("severity"));
        sl.setNotes(doc.getString("notes"));
        sl.setLoggedAt(doc.getDate("logged_at").toInstant());
        sl.setSymptomTypeName(doc.getString("symptom_type"));
        return sl;
    }
}
