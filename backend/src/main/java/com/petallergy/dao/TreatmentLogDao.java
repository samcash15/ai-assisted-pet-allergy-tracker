package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.petallergy.config.DatabaseConfig;
import com.petallergy.model.TreatmentLog;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.time.Instant;
import java.util.*;

public class TreatmentLogDao {

    private final MongoCollection<Document> collection;
    private final MongoCollection<Document> treatmentsCol;
    private final MongoCollection<Document> usersCol;

    public TreatmentLogDao(MongoDatabase db) {
        this.collection = db.getCollection("treatment_logs");
        this.treatmentsCol = db.getCollection("treatments");
        this.usersCol = db.getCollection("users");
    }

    public List<TreatmentLog> findByPetId(int petId) {
        List<TreatmentLog> logs = new ArrayList<>();
        collection.find(Filters.eq("pet_id", petId))
                  .sort(Sorts.descending("administered_at"))
                  .forEach(doc -> logs.add(mapDoc(doc)));
        return logs;
    }

    public List<TreatmentLog> findByPetIdAndDateRange(int petId, Instant from, Instant to) {
        Bson filter = Filters.and(
            Filters.eq("pet_id", petId),
            Filters.gte("administered_at", Date.from(from)),
            Filters.lte("administered_at", Date.from(to))
        );
        List<TreatmentLog> logs = new ArrayList<>();
        collection.find(filter).sort(Sorts.descending("administered_at")).forEach(doc -> logs.add(mapDoc(doc)));
        return logs;
    }

    public TreatmentLog insert(TreatmentLog log) {
        int id = DatabaseConfig.getNextId("treatment_logs");
        log.setTreatmentLogId(id);
        if (log.getAdministeredAt() == null) log.setAdministeredAt(Instant.now());

        // Denormalize treatment name/type and pet name at write time
        Document treatDoc = treatmentsCol.find(Filters.eq("_id", log.getTreatmentId())).first();
        String treatmentName = treatDoc != null ? treatDoc.getString("name") : "";
        String treatmentType = treatDoc != null ? treatDoc.getString("treatment_type") : "";
        log.setTreatmentName(treatmentName);
        log.setTreatmentType(treatmentType);

        String petName = getPetName(log.getPetId());

        Document doc = new Document("_id", id)
            .append("pet_id", log.getPetId())
            .append("pet_name", petName)
            .append("treatment_name", treatmentName)
            .append("treatment_type", treatmentType)
            .append("dosage", log.getDosage())
            .append("notes", log.getNotes())
            .append("administered_at", Date.from(log.getAdministeredAt()));

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

    private TreatmentLog mapDoc(Document doc) {
        TreatmentLog tl = new TreatmentLog();
        tl.setTreatmentLogId(doc.getInteger("_id"));
        tl.setPetId(doc.getInteger("pet_id"));
        tl.setDosage(doc.getString("dosage"));
        tl.setNotes(doc.getString("notes"));
        tl.setAdministeredAt(doc.getDate("administered_at").toInstant());
        tl.setTreatmentName(doc.getString("treatment_name"));
        tl.setTreatmentType(doc.getString("treatment_type"));
        return tl;
    }
}
