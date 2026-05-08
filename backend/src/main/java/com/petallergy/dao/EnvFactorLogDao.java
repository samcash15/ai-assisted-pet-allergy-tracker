package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.petallergy.config.DatabaseConfig;
import com.petallergy.model.EnvFactorLog;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public class EnvFactorLogDao {

    private final MongoCollection<Document> collection;
    private final MongoCollection<Document> envFactorTypesCol;
    private final MongoCollection<Document> usersCol;

    public EnvFactorLogDao(MongoDatabase db) {
        this.collection = db.getCollection("env_factor_logs");
        this.envFactorTypesCol = db.getCollection("env_factor_types");
        this.usersCol = db.getCollection("users");
    }

    public List<EnvFactorLog> findByPetId(int petId) {
        List<EnvFactorLog> logs = new ArrayList<>();
        collection.find(Filters.eq("pet_id", petId))
                  .sort(Sorts.descending("logged_at"))
                  .forEach(doc -> logs.add(mapDoc(doc)));
        return logs;
    }

    public List<EnvFactorLog> findByPetIdAndDateRange(int petId, Instant from, Instant to) {
        Bson filter = Filters.and(
            Filters.eq("pet_id", petId),
            Filters.gte("logged_at", Date.from(from)),
            Filters.lte("logged_at", Date.from(to))
        );
        List<EnvFactorLog> logs = new ArrayList<>();
        collection.find(filter).sort(Sorts.descending("logged_at")).forEach(doc -> logs.add(mapDoc(doc)));
        return logs;
    }

    public EnvFactorLog insert(EnvFactorLog log) {
        int id = DatabaseConfig.getNextId("env_factor_logs");
        log.setEnvFactorLogId(id);
        if (log.getLoggedAt() == null) log.setLoggedAt(Instant.now());

        // Denormalize type name/unit and pet name at write time
        Document typeDoc = envFactorTypesCol.find(Filters.eq("_id", log.getEnvFactorTypeId())).first();
        String typeName = typeDoc != null ? typeDoc.getString("name") : "";
        String typeUnit = typeDoc != null ? typeDoc.getString("unit") : "";
        log.setEnvFactorTypeName(typeName);
        log.setEnvFactorTypeUnit(typeUnit);

        String petName = getPetName(log.getPetId());

        Document doc = new Document("_id", id)
            .append("pet_id", log.getPetId())
            .append("pet_name", petName)
            .append("factor_name", typeName)
            .append("unit", typeUnit)
            .append("value", log.getValue().doubleValue())
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

    private EnvFactorLog mapDoc(Document doc) {
        EnvFactorLog efl = new EnvFactorLog();
        efl.setEnvFactorLogId(doc.getInteger("_id"));
        efl.setPetId(doc.getInteger("pet_id"));
        efl.setValue(BigDecimal.valueOf(((Number) doc.get("value")).doubleValue()));
        efl.setNotes(doc.getString("notes"));
        efl.setLoggedAt(doc.getDate("logged_at").toInstant());
        efl.setEnvFactorTypeName(doc.getString("factor_name"));
        efl.setEnvFactorTypeUnit(doc.getString("unit"));
        return efl;
    }
}
