package com.petallergy.config;

import com.mongodb.client.*;
import com.mongodb.client.model.*;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.*;
import java.util.*;

public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);
    private static MongoClient mongoClient;
    private static MongoDatabase database;

    public static MongoDatabase getDatabase() {
        if (mongoClient == null) {
            String uri = env("MONGODB_URI", "mongodb://localhost:27017");
            String dbName = env("MONGODB_DATABASE", "pet_allergy_tracker");
            mongoClient = MongoClients.create(uri);
            database = mongoClient.getDatabase(dbName);
            log.info("MongoDB connected: {}/{}", uri, dbName);
            initIndexes();
            seedData();
        }
        return database;
    }

    private static void initIndexes() {
        database.getCollection("symptom_logs")
                .createIndex(Indexes.ascending("pet_id", "logged_at"));
        database.getCollection("treatment_logs")
                .createIndex(Indexes.ascending("pet_id", "administered_at"));
        database.getCollection("env_factor_logs")
                .createIndex(Indexes.ascending("pet_id", "logged_at"));
        database.getCollection("users")
                .createIndex(Indexes.ascending("pets._id"));
        database.getCollection("llm_query_logs")
                .createIndex(Indexes.ascending("user_id", "created_at"));
        log.info("MongoDB indexes ensured");
    }

    // Atomic auto-increment using a counters collection
    public static int getNextId(String collection) {
        Document result = database.getCollection("counters").findOneAndUpdate(
            new Document("_id", collection),
            new Document("$inc", new Document("seq", 1)),
            new FindOneAndUpdateOptions().upsert(true).returnDocument(ReturnDocument.AFTER)
        );
        return result.getInteger("seq");
    }

    private static void seedData() {
        if (database.getCollection("users").countDocuments() > 0) {
            log.info("Seed data already exists — skipping");
            return;
        }
        seedUsers();
        seedSymptomTypes();
        seedTreatments();
        seedEnvFactorTypes();

        // Prime counters so new inserts continue from the right sequence
        initCounter("users", 1);
        initCounter("pets", 1);
        initCounter("symptom_types", 7);
        initCounter("treatments", 6);
        initCounter("env_factor_types", 4);
        initCounter("symptom_logs", 0);
        initCounter("treatment_logs", 0);
        initCounter("env_factor_logs", 0);
        initCounter("llm_query_logs", 0);

        log.info("Reference data seeded. Load log data via seed.js with mongosh.");
    }

    private static void initCounter(String collection, int max) {
        database.getCollection("counters").updateOne(
            new Document("_id", collection),
            new Document("$set", new Document("seq", max)),
            new UpdateOptions().upsert(true)
        );
    }

    private static void seedUsers() {
        Document finnPet = new Document("_id", 1)
            .append("name", "Finn")
            .append("species", "Dog")
            .append("breed", "Golden Retriever")
            .append("date_of_birth", Date.from(
                LocalDate.of(2021, 3, 15).atStartOfDay(ZoneOffset.UTC).toInstant()))
            .append("created_at", new Date());

        database.getCollection("users").insertOne(new Document()
            .append("_id", 1)
            .append("username", "sam")
            .append("email", "sam@example.com")
            .append("created_at", new Date())
            .append("pets", List.of(finnPet)));
    }

    private static void seedSymptomTypes() {
        database.getCollection("symptom_types").insertMany(List.of(
            new Document("_id", 1).append("name", "Itching")
                .append("description", "Generalized scratching and itching behavior"),
            new Document("_id", 2).append("name", "Skin Redness")
                .append("description", "Visible redness or inflammation on the skin"),
            new Document("_id", 3).append("name", "Sneezing")
                .append("description", "Repeated sneezing episodes"),
            new Document("_id", 4).append("name", "Ear Inflammation")
                .append("description", "Redness, swelling, or discharge inside the ears"),
            new Document("_id", 5).append("name", "Paw Licking")
                .append("description", "Excessive licking or chewing of paws"),
            new Document("_id", 6).append("name", "Watery Eyes")
                .append("description", "Excessive tearing or eye discharge"),
            new Document("_id", 7).append("name", "Nasal Discharge")
                .append("description", "Runny nose or nasal drip")
        ));
    }

    private static void seedTreatments() {
        database.getCollection("treatments").insertMany(List.of(
            new Document("_id", 1).append("name", "Apoquel")
                .append("treatment_type", "medication")
                .append("description", "Oclacitinib — daily oral JAK inhibitor for allergic itch"),
            new Document("_id", 2).append("name", "Cytopoint Injection")
                .append("treatment_type", "medication")
                .append("description", "Lokivetmab — monthly injectable antibody targeting IL-31"),
            new Document("_id", 3).append("name", "Medicated Shampoo")
                .append("treatment_type", "topical")
                .append("description", "Chlorhexidine/ketoconazole shampoo for skin infections"),
            new Document("_id", 4).append("name", "Grain-Free Diet")
                .append("treatment_type", "dietary")
                .append("description", "Limited-ingredient grain-free kibble to reduce food allergens"),
            new Document("_id", 5).append("name", "Hydrocortisone Cream")
                .append("treatment_type", "topical")
                .append("description", "OTC 1% hydrocortisone for localized hot spots"),
            new Document("_id", 6).append("name", "Allergy Immunotherapy")
                .append("treatment_type", "therapy")
                .append("description", "Subcutaneous allergy shots based on intradermal testing")
        ));
    }

    private static void seedEnvFactorTypes() {
        database.getCollection("env_factor_types").insertMany(List.of(
            new Document("_id", 1).append("name", "Pollen Count")
                .append("unit", "index").append("description", "Daily pollen index (0-12 scale)"),
            new Document("_id", 2).append("name", "Temperature")
                .append("unit", "°F").append("description", "Outdoor temperature in Fahrenheit"),
            new Document("_id", 3).append("name", "Humidity")
                .append("unit", "%").append("description", "Relative humidity percentage"),
            new Document("_id", 4).append("name", "Mold Spore Count")
                .append("unit", "index").append("description", "Daily mold spore index (0-12 scale)")
        ));
    }

    public static void close() {
        if (mongoClient != null) {
            mongoClient.close();
            log.info("MongoDB client closed");
        }
    }

    private static String env(String key, String defaultValue) {
        String v = System.getenv(key);
        return v != null ? v : defaultValue;
    }
}
