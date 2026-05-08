// ============================================================
// Pet Allergy Symptom Tracking System — MongoDB Schema Setup
// CS 5600 Advanced Database Systems — Spring 2026
// ============================================================
// Run with: mongosh pet_allergy_tracker schema.js
//
// Design notes:
//   - Pets are embedded as an array inside users documents,
//     eliminating the need for a separate pets collection.
//   - Log collections (symptom_logs, treatment_logs, env_factor_logs)
//     embed pet_name and type names at write time (denormalization)
//     so reads never need $lookup. This trades a small write-time
//     lookup for much faster, simpler aggregation queries.
//   - Reference collections (symptom_types, treatments, env_factor_types)
//     are still kept normalized so a type name can be corrected
//     in one place without a bulk update of log documents.
//   - Integer _id on all collections; a "counters" collection
//     provides atomic auto-increment via findOneAndUpdate + $inc.
//   - All field names use snake_case; all timestamps are UTC ISODate.
// ============================================================

// Drop the entire database for a clean re-run
db.dropDatabase();

// ── Indexes ───────────────────────────────────────────────────

// symptom_logs: primary query pattern is (pet_id, logged_at range)
db.symptom_logs.createIndex({ pet_id: 1, logged_at: 1 });

// treatment_logs: primary query pattern is (pet_id, administered_at range)
db.treatment_logs.createIndex({ pet_id: 1, administered_at: 1 });

// env_factor_logs: primary query pattern is (pet_id, logged_at range)
db.env_factor_logs.createIndex({ pet_id: 1, logged_at: 1 });

// users: look up embedded pets by pet _id
db.users.createIndex({ "pets._id": 1 });

// llm_query_logs: look up chat history by user, newest first
db.llm_query_logs.createIndex({ user_id: 1, created_at: -1 });

// ── JSON Schema Validators ────────────────────────────────────

db.createCollection("symptom_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["pet_id", "symptom_type", "severity", "logged_at"],
      properties: {
        pet_id:       { bsonType: "int" },
        symptom_type: { bsonType: "string" },
        severity:     { bsonType: "int", minimum: 1, maximum: 10,
                        description: "Severity must be 1–10" },
        logged_at:    { bsonType: "date" }
      }
    }
  }
});

db.createCollection("treatment_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["pet_id", "treatment_name", "administered_at"],
      properties: {
        pet_id:          { bsonType: "int" },
        treatment_name:  { bsonType: "string" },
        administered_at: { bsonType: "date" }
      }
    }
  }
});

db.createCollection("env_factor_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["pet_id", "factor_name", "value", "logged_at"],
      properties: {
        pet_id:     { bsonType: "int" },
        factor_name: { bsonType: "string" },
        value:      { bsonType: "double" },
        logged_at:  { bsonType: "date" }
      }
    }
  }
});

print("Schema setup complete.");
print("Next: run seed.js to load reference data and sample logs.");
