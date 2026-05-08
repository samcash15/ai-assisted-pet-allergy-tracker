# CS 5600: Advanced Database Systems
## Final Report — AI-Assisted Pet Allergy Symptom Tracking System

**Student:** Sam Cashion
**Student ID:** 700619652
**Email:** scc96520@ucmo.edu
**CRN:** 23405 | **Group:** Group 2
**Course:** CS 5600 — Advanced Database Systems, Spring 2026

---

## Table of Contents

1. [Project Description](#1-project-description)
2. [Database Description](#2-database-description)
3. [Database Diagram](#3-database-diagram)
4. [Data Dictionary](#4-data-dictionary)
5. [Sample Data](#5-sample-data)
6. [User Interfaces and Forms](#6-user-interfaces-and-forms)
7. [Source Code](#7-source-code)
8. [NoSQL Commands](#8-nosql-commands)

---

## 1. Project Description

### Purpose of the Database

The purpose of this database application is to track and analyze allergy-related symptoms in pets over time. This project is motivated by my personal experience managing chronic allergies in my own dog, Finn. Finn experiences recurring allergy symptoms such as severe itching and skin irritation that fluctuate daily. Without a structured way to record this information, it is difficult to identify patterns, evaluate symptom severity over time, or clearly summarize his allergy history.

The database provides a consistent and organized method for recording allergy symptoms and transforming daily observations into meaningful information. The system allows users to create pet profiles and log daily allergy symptoms, including the symptom type, severity level, date, and optional notes. This data enables the system to support queries that analyze symptom trends and summarize allergy activity over a selected period.

### Users and Information Needs

The primary users of the system are pet owners managing pets with chronic or recurring allergies. These users need to understand:
- What symptoms their pet has experienced and how frequently
- Whether symptom severity is improving or worsening over time
- Which treatments are most effective at reducing symptoms
- How environmental factors (pollen, humidity, mold) correlate with symptom flare-ups

### Problems the System Solves

- **Fragmented tracking** — pet owners rely on memory or scattered notes; this system provides a single structured record
- **Pattern identification** — without aggregated data, it is difficult to see that symptoms spike when pollen exceeds a certain threshold
- **Treatment effectiveness** — correlating treatment logs with symptom logs reveals whether medications like Apoquel or Cytopoint are working
- **Communication with veterinarians** — a structured history makes vet visits more productive

### Input Data

- Pet profile information (name, species, breed, date of birth)
- Daily symptom entries: symptom type, severity rating (1–10), timestamp, optional notes
- Treatment administration records: medication/therapy type, dosage, timestamp
- Environmental factor readings: pollen count, temperature, humidity, mold spore count

### LLM Integration

To improve accessibility, the system integrates a Large Language Model (LLM) using Ollama (Llama 3.2, running locally). Users can ask natural language questions such as:
- *"What are Finn's most common symptoms?"*
- *"Is there a correlation between pollen count and itching severity?"*
- *"Which treatments helped reduce symptoms the most?"*
- *"Show average severity by month."*

The LLM translates these questions into MongoDB aggregation pipelines, executes them against the live database, and returns a plain-English summary alongside the raw result data. All queries and responses are logged in the `llm_query_logs` collection for audit purposes.

---

## 2. Database Description

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Database | MongoDB (NoSQL Document Store) | 8.3 |
| Backend | Java + Javalin + MongoDB Driver | Java 17, Javalin 6.7.0, mongodb-driver-sync 5.2.0 |
| Frontend | HTML + Vanilla JavaScript + Tailwind CSS | No build step required |
| LLM | Ollama (Llama 3.2, local) | REST API at localhost:11434 |
| Build | Apache Maven (Shade plugin for fat JAR) | 3.9+ |

### Database Overview

The application uses MongoDB with **9 collections** organized into two groups:

**Reference Collections** (normalized, rarely change):
- `users` (with pets embedded as an array), `symptom_types`, `treatments`, `env_factor_types`

**Log Collections** (time-series, write-heavy):
- `symptom_logs`, `treatment_logs`, `env_factor_logs`, `llm_query_logs`

**Supporting Collection:**
- `counters` — provides atomic auto-increment integer `_id` values for all collections

### Key Design Decisions

**1. Pets Embedded in Users**
Each `users` document contains a `pets` array. This collocates owner and pet data, eliminates a separate `pets` collection, and makes fetching all of a user's pets a single document read.

**2. Denormalized Log Documents**
Log collections (`symptom_logs`, `treatment_logs`, `env_factor_logs`) embed the pet name and type names at write time. For example, a `symptom_logs` document stores `symptom_type: "Itching"` directly. This eliminates `$lookup` joins in aggregation queries, making LLM-generated pipelines simpler, faster, and less error-prone.

**3. Normalized Reference Collections**
Reference data (`symptom_types`, `treatments`, `env_factor_types`) is kept in separate collections so that a name change (e.g., renaming a treatment) only requires updating one document rather than a bulk update across thousands of log entries.

**4. Integer `_id` via Counters Collection**
A `counters` collection provides atomic auto-increment using `findOneAndUpdate` with `$inc` and `ReturnDocument.AFTER`. This gives integer primary keys that are intuitive for a class demo and compatible with REST API routes (`/api/pets/1`).

**5. Snake_case Field Names**
All collection names and document field names use snake_case (e.g., `pet_id`, `logged_at`, `treatment_type`) for consistency with the project design specification.

**6. Compound Indexes on Primary Query Patterns**
All log collections are indexed on `(pet_id, logged_at)` or `(pet_id, administered_at)`, matching the primary access pattern: "get all logs for a specific pet within a date range."

**7. LLM Query Safety**
The `OllamaService` validates every LLM-generated pipeline before execution:
- Parses with `BsonDocument.parse()` — rejects invalid JSON
- Validates the collection name against an explicit allowlist
- Iterates pipeline stages to block `$out` and `$merge` (write stages)

---

## 3. Database Diagram

### Collection Relationship Diagram

```
┌────────────────────────────────────────────────┐
│   users                                        │
│────────────────────────────────────────────────│
│ _id (int)                                      │
│ username (string)                              │
│ email (string)                                 │
│ created_at (Date)                              │
│                                                │
│  pets[] ──────────────────────────────────┐   │
│  ├── _id (int)                            │   │
│  ├── name (string)                        │   │
│  ├── species (string)                     │   │
│  ├── breed (string)                       │   │
│  ├── date_of_birth (Date)                 │   │
│  └── created_at (Date)                    │   │
└───────────────────────────────────────────┼───┘
                                            │
        ┌───────────────────────────────────┘ pet_id references users.pets._id
        │
        ▼
┌──────────────────────────────────────────────┐
│  symptom_logs                                │
│──────────────────────────────────────────────│
│ _id (int)                                    │
│ pet_id (int)                                 │
│ pet_name (string, denormalized)              │
│ symptom_type (string, denorm.) ─────────────►│ symptom_types.name
│ severity (int, 1–10)                         │
│ notes (string)                               │
│ logged_at (Date)                             │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  treatment_logs                              │
│──────────────────────────────────────────────│
│ _id (int)                                    │
│ pet_id (int)                                 │
│ pet_name (string, denormalized)              │
│ treatment_name (string, denorm.) ───────────►│ treatments.name
│ treatment_type (string, denorm.)             │
│ dosage (string)                              │
│ notes (string)                               │
│ administered_at (Date)                       │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  env_factor_logs                             │
│──────────────────────────────────────────────│
│ _id (int)                                    │
│ pet_id (int)                                 │
│ pet_name (string, denormalized)              │
│ factor_name (string, denorm.) ──────────────►│ env_factor_types.name
│ unit (string, denorm.)                       │
│ value (double)                               │
│ notes (string)                               │
│ logged_at (Date)                             │
└──────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌────────────────┐
│ symptom_types│  │  treatments  │  │env_factor_types│
│──────────────│  │──────────────│  │────────────────│
│ _id (int)    │  │ _id (int)    │  │ _id (int)      │
│ name         │  │ name         │  │ name           │
│ description  │  │treatment_type│  │ unit           │
└──────────────┘  │ description  │  │ description    │
                  └──────────────┘  └────────────────┘

┌──────────────────────────────────────────────┐
│  llm_query_logs                              │
│──────────────────────────────────────────────│
│ _id (int)                                    │
│ user_id (int)                                │
│ natural_language_query (string)              │
│ generated_sql (string) — pipeline JSON       │
│ response_summary (string)                    │
│ error_message (string)                       │
│ created_at (Date)                            │
└──────────────────────────────────────────────┘

┌──────────────┐
│   counters   │
│──────────────│
│ _id (string) │  e.g. "symptom_logs"
│ seq (int)    │
└──────────────┘
```

### Indexes

| Collection | Index Fields | Purpose |
|---|---|---|
| `symptom_logs` | `(pet_id, logged_at)` | Date-range queries per pet |
| `treatment_logs` | `(pet_id, administered_at)` | Date-range queries per pet |
| `env_factor_logs` | `(pet_id, logged_at)` | Date-range queries per pet |
| `users` | `(pets._id)` | Look up embedded pet by ID |
| `llm_query_logs` | `(user_id, created_at DESC)` | Chat history, newest first |

---

## 4. Data Dictionary

### Collection: `users`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `username` | string | Yes | Unique login name |
| `email` | string | Yes | Unique email address |
| `created_at` | Date | Yes | UTC timestamp of account creation |
| `pets` | array | Yes | Embedded array of pet subdocuments (see below) |

**Embedded `pets` subdocument fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key for the pet |
| `name` | string | Yes | Pet's name (e.g., "Finn") |
| `species` | string | Yes | Species (e.g., "Dog", "Cat") |
| `breed` | string | No | Breed (e.g., "Golden Retriever") |
| `date_of_birth` | Date | No | Pet's date of birth (UTC midnight) |
| `created_at` | Date | Yes | UTC timestamp of record creation |

---

### Collection: `symptom_types`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `name` | string | Yes | Unique symptom name (e.g., "Itching") |
| `description` | string | No | Plain-English description of the symptom |

**Seeded values:** Itching, Skin Redness, Sneezing, Ear Inflammation, Paw Licking, Watery Eyes, Nasal Discharge

---

### Collection: `symptom_logs`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `pet_id` | int | Yes | Reference to `users.pets._id` |
| `pet_name` | string | Yes | Denormalized pet name (embedded at write time) |
| `symptom_type` | string | Yes | Denormalized symptom name (embedded at write time) |
| `severity` | int | Yes | Severity score 1 (mild) – 10 (severe) |
| `notes` | string | No | Optional free-text observation notes |
| `logged_at` | Date | Yes | UTC timestamp of the observation |

---

### Collection: `treatments`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `name` | string | Yes | Unique treatment name (e.g., "Apoquel") |
| `treatment_type` | string | Yes | Category: `medication`, `topical`, `dietary`, or `therapy` |
| `description` | string | No | Description of the treatment |

**Seeded values:** Apoquel, Cytopoint Injection, Medicated Shampoo, Grain-Free Diet, Hydrocortisone Cream, Allergy Immunotherapy

---

### Collection: `treatment_logs`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `pet_id` | int | Yes | Reference to `users.pets._id` |
| `pet_name` | string | Yes | Denormalized pet name (embedded at write time) |
| `treatment_name` | string | Yes | Denormalized treatment name (embedded at write time) |
| `treatment_type` | string | Yes | Denormalized treatment type (embedded at write time) |
| `dosage` | string | No | Dosage administered (e.g., "16mg tablet") |
| `notes` | string | No | Optional administration notes |
| `administered_at` | Date | Yes | UTC timestamp of administration |

---

### Collection: `env_factor_types`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `name` | string | Yes | Unique factor name (e.g., "Pollen Count") |
| `unit` | string | Yes | Unit of measurement (e.g., "index", "°F", "%") |
| `description` | string | No | Description of what the factor measures |

**Seeded values:** Pollen Count (index, 0–12 scale), Temperature (°F), Humidity (%), Mold Spore Count (index, 0–12 scale)

---

### Collection: `env_factor_logs`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `pet_id` | int | Yes | Reference to `users.pets._id` |
| `pet_name` | string | Yes | Denormalized pet name (embedded at write time) |
| `factor_name` | string | Yes | Denormalized factor name (embedded at write time) |
| `unit` | string | Yes | Denormalized unit of measurement (embedded at write time) |
| `value` | double | Yes | Numeric reading (e.g., 9.5 for pollen index) |
| `notes` | string | No | Optional notes about conditions |
| `logged_at` | Date | Yes | UTC timestamp of the reading |

---

### Collection: `llm_query_logs`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | int | Yes | Auto-incremented primary key |
| `user_id` | int | Yes | Reference to `users._id` |
| `natural_language_query` | string | Yes | The original question the user typed |
| `generated_sql` | string | No | The MongoDB aggregation pipeline JSON generated by the LLM |
| `response_summary` | string | No | Plain-English summary returned to the user |
| `error_message` | string | No | Error details if the query failed |
| `created_at` | Date | Yes | UTC timestamp of the query |

---

### Collection: `counters`
| Field | Type | Description |
|---|---|---|
| `_id` | string | Collection name (e.g., `"symptom_logs"`) |
| `seq` | int | Current max integer ID for that collection |

---

## 5. Sample Data

### Sample: `symptom_logs` Documents
```json
{
  "_id": 1,
  "pet_id": 1,
  "pet_name": "Finn",
  "symptom_type": "Itching",
  "severity": 3,
  "notes": "Mild scratching after morning walk — spring has arrived",
  "logged_at": { "$date": "2026-05-01T19:00:00Z" }
}

{
  "_id": 23,
  "pet_id": 1,
  "pet_name": "Finn",
  "symptom_type": "Itching",
  "severity": 9,
  "notes": "Peak severity — applied hydrocortisone, Apoquel not enough",
  "logged_at": { "$date": "2026-05-13T14:00:00Z" }
}
```

### Sample: `treatment_logs` Documents
```json
{
  "_id": 1,
  "pet_id": 1,
  "pet_name": "Finn",
  "treatment_name": "Apoquel",
  "treatment_type": "medication",
  "dosage": "16mg tablet",
  "notes": "Morning dose with food",
  "administered_at": { "$date": "2026-05-01T13:00:00Z" }
}

{
  "_id": 32,
  "pet_id": 1,
  "pet_name": "Finn",
  "treatment_name": "Cytopoint Injection",
  "treatment_type": "medication",
  "dosage": "40mg injection",
  "notes": "Monthly Cytopoint — early May dose before pollen peak",
  "administered_at": { "$date": "2026-05-05T20:00:00Z" }
}
```

### Sample: `env_factor_logs` Documents
```json
{
  "_id": 13,
  "pet_id": 1,
  "pet_name": "Finn",
  "factor_name": "Pollen Count",
  "unit": "index",
  "value": 11.8,
  "notes": "Season peak — worst day",
  "logged_at": { "$date": "2026-05-13T12:00:00Z" }
}

{
  "_id": 45,
  "pet_id": 1,
  "pet_name": "Finn",
  "factor_name": "Temperature",
  "unit": "°F",
  "value": 80.0,
  "notes": "Hottest day of month — mold and pollen peak",
  "logged_at": { "$date": "2026-05-21T12:00:00Z" }
}
```

### Sample: `llm_query_logs` Document
```json
{
  "_id": 1,
  "user_id": 1,
  "natural_language_query": "What are Finn's most common symptoms?",
  "generated_sql": "{\"collection\":\"symptom_logs\",\"pipeline\":[{\"$group\":{\"_id\":\"$symptom_type\",\"count\":{\"$sum\":1},\"avgSeverity\":{\"$avg\":\"$severity\"}}},{\"$sort\":{\"count\":-1}},{\"$limit\":10}]}",
  "response_summary": "Finn's most common symptom is Itching (logged 45 times, average severity 5.2), followed by Paw Licking (28 times, avg 4.8) and Skin Redness (22 times, avg 4.5).",
  "error_message": null,
  "created_at": { "$date": "2026-05-01T20:15:00Z" }
}
```

### Dataset Summary

The application ships with three seed datasets:

| Script | Period | Symptom Logs | Treatment Logs | Env Factor Logs |
|---|---|---|---|---|
| `seed.js` | Dec 15, 2025 – Feb 13, 2026 | ~74 | ~55 | ~90 |
| `seed_may_2026.js` | May 1–31, 2026 | 71 | 37 | 72 |

**May 2026 Story:** Peak spring allergy season. Two major flares — May 10–14 (grass pollen peaks at 11.8) and May 19–24 (mixed pollen + mold wave, mold peaks at 8.0). Cytopoint injections given May 5 and May 28. Apoquel administered daily.

---

## 6. User Interfaces and Forms

The application is a multi-page web application served at `http://localhost:7070`.

### Page 1: Dashboard (`/`)
![Dashboard](dashboard%20screenshot.png)

The dashboard provides an at-a-glance overview of pet health data:
- Summary cards showing total pets, symptom logs, treatment logs, and average severity
- A severity trend line chart showing symptom severity over time
- A top symptoms bar chart ranked by frequency
- A recent activity feed showing the latest logs across all categories

### Page 2: Pets (`/pets.html`)
![Pets](pets%20screenshot.png)

Displays all registered pets as cards. Each card shows the pet's name, species, breed, and age. An **Add Pet** button opens a form to register a new pet with fields for name, species, breed, and date of birth.

### Page 3: Pet Detail (`/pet-detail.html?petId=1`)
![Pet Detail](pet%20details%20screenshot.png)

The main data-entry interface for a single pet. Contains three logging forms:
- **Log Symptom** — select symptom type, enter severity (1–10 slider), optional notes, date/time
- **Log Treatment** — select treatment, enter dosage, optional notes, date/time
- **Log Environmental Factor** — select factor type, enter value, optional notes, date/time

Below the forms, three tabbed tables display recent log history for symptoms, treatments, and environmental factors.

### Page 4: AI Chat (`/chat.html`)
![AI Chat](ai%20chat%20screenshot.png)

A conversational interface where users type natural language questions. The response displays:
- A plain-English summary from the LLM
- A collapsible **Show Pipeline** section revealing the raw MongoDB aggregation pipeline JSON
- A formatted results table with the actual database records returned

![AI Chat Pipeline](ai%20chat%20screenshot.png)

Sample interactions:
- *"What are Finn's most common symptoms?"* → groups and counts symptom logs
- *"Show average severity by month"* → date-bucket aggregation
- *"Is there a correlation between pollen and itching?"* → compares `env_factor_logs` and `symptom_logs` values over time

---

## 7. Source Code

### App.java — Application Entry Point
```java
public class App {
    public static void main(String[] args) {
        MongoDatabase db = DatabaseConfig.getDatabase();

        // DAOs
        PetDao petDao                   = new PetDao(db);
        SymptomTypeDao symptomTypeDao   = new SymptomTypeDao(db);
        SymptomLogDao symptomLogDao     = new SymptomLogDao(db);
        TreatmentDao treatmentDao       = new TreatmentDao(db);
        TreatmentLogDao treatmentLogDao = new TreatmentLogDao(db);
        EnvFactorTypeDao envFactorTypeDao = new EnvFactorTypeDao(db);
        EnvFactorLogDao envFactorLogDao = new EnvFactorLogDao(db);
        LlmQueryLogDao llmQueryLogDao   = new LlmQueryLogDao(db);

        // Services
        OllamaService ollamaService = new OllamaService(db, llmQueryLogDao);

        Javalin app = Javalin.create(config -> {
            config.staticFiles.add("/public", Location.CLASSPATH);
            config.http.defaultContentType = "application/json";
            config.jsonMapper(new JavalinJackson().updateMapper(mapper -> {
                mapper.registerModule(new JavaTimeModule());
                mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            }));
        });

        petController.registerRoutes(app);
        symptomController.registerRoutes(app);
        treatmentController.registerRoutes(app);
        envFactorController.registerRoutes(app);
        chatController.registerRoutes(app);

        app.start(7070);
    }
}
```

---

### DatabaseConfig.java — MongoDB Connection and Auto-Increment
```java
public class DatabaseConfig {

    public static MongoDatabase getDatabase() {
        if (mongoClient == null) {
            String uri = env("MONGODB_URI", "mongodb://localhost:27017");
            String dbName = env("MONGODB_DATABASE", "pet_allergy_tracker");
            mongoClient = MongoClients.create(uri);
            database = mongoClient.getDatabase(dbName);
            initIndexes();
            seedData();
        }
        return database;
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
    }
}
```

---

### SymptomLogDao.java — Insert with Denormalization
```java
public SymptomLog insert(SymptomLog log) {
    int id = DatabaseConfig.getNextId("symptom_logs");
    log.setSymptomLogId(id);
    if (log.getLoggedAt() == null) log.setLoggedAt(Instant.now());

    // Denormalize: embed type name and pet name at write time
    Document typeDoc = symptomTypesCol.find(Filters.eq("_id", log.getSymptomTypeId())).first();
    String typeName = typeDoc != null ? typeDoc.getString("name") : "";
    log.setSymptomTypeName(typeName);

    // Pet name is looked up from the embedded pets array in users
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

private String getPetName(int petId) {
    Document userDoc = usersCol.find(
        Filters.elemMatch("pets", Filters.eq("_id", petId))
    ).first();
    if (userDoc == null) return "";
    List<Document> pets = userDoc.getList("pets", Document.class);
    if (pets == null) return "";
    return pets.stream()
        .filter(p -> Integer.valueOf(petId).equals(p.getInteger("_id")))
        .map(p -> p.getString("name"))
        .findFirst().orElse("");
}
```

---

### OllamaService.java — LLM Integration (Key Methods)
```java
// Validate and safety-check the LLM-generated pipeline JSON
private String validateQuery(String raw) {
    // Strip markdown code fences if present
    String cleaned = raw.replaceAll("(?s)```[a-z]*\\n?", "").replaceAll("```", "").trim();

    // Parse with BsonDocument for strict JSON validation
    BsonDocument parsed = BsonDocument.parse(cleaned);

    // Validate collection name against allowlist
    String collection = parsed.getString("collection").getValue();
    if (!ALLOWED_COLLECTIONS.contains(collection)) {
        throw new QueryRejectionException("Collection not allowed: " + collection);
    }

    // Block write stages ($out, $merge)
    BsonArray pipeline = parsed.getArray("pipeline");
    for (int i = 0; i < pipeline.size(); i++) {
        BsonDocument stage = pipeline.get(i).asDocument();
        if (stage.containsKey("$out") || stage.containsKey("$merge")) {
            throw new QueryRejectionException("Write stages ($out, $merge) are not permitted");
        }
    }
    return cleaned;
}

// Execute the aggregation pipeline against MongoDB
private List<Map<String, Object>> executeAggregation(String pipelineJson) {
    BsonDocument parsed = BsonDocument.parse(pipelineJson);
    String collectionName = parsed.getString("collection").getValue();
    BsonArray pipelineArray = parsed.getArray("pipeline");

    List<Document> stages = new ArrayList<>();
    for (int i = 0; i < pipelineArray.size(); i++) {
        stages.add(Document.parse(pipelineArray.get(i).asDocument().toJson()));
    }

    List<Map<String, Object>> results = new ArrayList<>();
    db.getCollection(collectionName).aggregate(stages)
      .forEach(doc -> results.add(docToMap(doc)));
    return results;
}
```

---

### ChatController.java — REST Endpoint
```java
public class ChatController {

    public void registerRoutes(Javalin app) {
        app.post("/api/chat", this::chat);
        app.get("/api/chat/history", this::chatHistory);
    }

    private void chat(Context ctx) throws Exception {
        Map<?, ?> body = ctx.bodyAsClass(Map.class);
        String query = (String) body.get("query");

        if (query == null || query.isBlank()) {
            ctx.status(400).json(Map.of("error", "Query is required"));
            return;
        }

        try {
            Map<String, Object> response = ollamaService.processQuery(query, DEFAULT_USER_ID);
            ctx.json(response);
        } catch (OllamaService.OllamaUnavailableException e) {
            ctx.status(503).json(Map.of(
                "error", "LLM service unavailable. Make sure Ollama is running.",
                "naturalLanguageQuery", query
            ));
        }
    }
}
```

---

### REST API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/pets` | List all pets |
| POST | `/api/pets` | Add a new pet |
| PUT | `/api/pets/:id` | Update pet details |
| GET | `/api/pets/:id/symptoms` | Get symptom logs for a pet |
| POST | `/api/pets/:id/symptoms` | Log a new symptom |
| GET | `/api/pets/:id/treatments` | Get treatment logs for a pet |
| POST | `/api/pets/:id/treatments` | Log a new treatment |
| GET | `/api/pets/:id/envfactors` | Get environmental factor logs |
| POST | `/api/pets/:id/envfactors` | Log an environmental factor |
| POST | `/api/chat` | Submit a natural language query to the LLM |
| GET | `/api/chat/history` | Retrieve past AI chat queries |

---

## 8. NoSQL Commands

### schema.js — Index and Validator Setup
```javascript
// Run with: mongosh pet_allergy_tracker schema.js

// Drop and recreate collections for clean setup
db.symptom_logs.drop();
db.treatment_logs.drop();
db.env_factor_logs.drop();
db.llm_query_logs.drop();
db.symptom_types.drop();
db.treatments.drop();
db.env_factor_types.drop();
db.users.drop();
db.counters.drop();

// Create compound indexes on primary query patterns
db.symptom_logs.createIndex({ pet_id: 1, logged_at: 1 });
db.treatment_logs.createIndex({ pet_id: 1, administered_at: 1 });
db.env_factor_logs.createIndex({ pet_id: 1, logged_at: 1 });
db.users.createIndex({ "pets._id": 1 });
db.llm_query_logs.createIndex({ user_id: 1, created_at: -1 });

// Add JSON Schema validator to enforce required fields and severity range
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
```

---

### seed.js — Sample Aggregation Queries (mongosh)

**Query 1: Most common symptoms, sorted by frequency**
```javascript
db.symptom_logs.aggregate([
  { $group: {
      _id: "$symptom_type",
      count: { $sum: 1 },
      avgSeverity: { $avg: "$severity" }
  }},
  { $sort: { count: -1 } }
]);
```

**Query 2: Average symptom severity by month**
```javascript
db.symptom_logs.aggregate([
  { $group: {
      _id: {
        year:  { $year:  "$logged_at" },
        month: { $month: "$logged_at" }
      },
      avgSeverity: { $avg: "$severity" },
      totalLogs:   { $sum: 1 }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1 } }
]);
```

**Query 3: All treatments Finn has received, most frequent first**
```javascript
db.treatment_logs.aggregate([
  { $match: { pet_name: { $regex: "finn", $options: "i" } } },
  { $group: {
      _id: { name: "$treatment_name", type: "$treatment_type" },
      count: { $sum: 1 },
      lastGiven: { $max: "$administered_at" }
  }},
  { $sort: { count: -1 } }
]);
```

**Query 4: Pollen count on days when itching severity was 7 or higher**
```javascript
db.symptom_logs.aggregate([
  { $match: { symptom_type: "Itching", severity: { $gte: 7 } } },
  { $project: {
      date: { $dateToString: { format: "%Y-%m-%d", date: "$logged_at" } },
      severity: 1
  }},
  { $sort: { date: 1 } }
]);
```

**Query 5: Symptom flare days (severity ≥ 7) count by month**
```javascript
db.symptom_logs.aggregate([
  { $match: { severity: { $gte: 7 } } },
  { $group: {
      _id: {
        year:  { $year:  "$logged_at" },
        month: { $month: "$logged_at" }
      },
      flareDays: { $sum: 1 },
      peakSeverity: { $max: "$severity" }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1 } }
]);
```

**Query 6: High-pollen days (pollen index > 8)**
```javascript
db.env_factor_logs.aggregate([
  { $match: { factor_name: "Pollen Count", value: { $gt: 8 } } },
  { $group: { _id: null, avgPollen: { $avg: "$value" }, count: { $sum: 1 } } }
]);
```

**Query 7: Total treatment administrations by type**
```javascript
db.treatment_logs.aggregate([
  { $group: {
      _id: "$treatment_type",
      total: { $sum: 1 },
      treatments: { $addToSet: "$treatment_name" }
  }},
  { $sort: { total: -1 } }
]);
```

**Query 8: Atomic auto-increment (counters collection)**
```javascript
// Get next ID for the symptom_logs collection
db.counters.findOneAndUpdate(
  { _id: "symptom_logs" },
  { $inc: { seq: 1 } },
  { upsert: true, returnDocument: "after" }
);
```

**Query 9: Insert a new symptom log**
```javascript
db.symptom_logs.insertOne({
  _id: db.counters.findOneAndUpdate(
    { _id: "symptom_logs" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  ).seq,
  pet_id: 1,
  pet_name: "Finn",
  symptom_type: "Itching",
  severity: 6,
  notes: "Scratching after afternoon walk",
  logged_at: new Date()
});
```

**Query 10: Find all symptom logs for Finn in May 2026**
```javascript
db.symptom_logs.find({
  pet_id: 1,
  logged_at: {
    $gte: ISODate("2026-05-01T00:00:00Z"),
    $lte: ISODate("2026-05-31T23:59:59Z")
  }
}).sort({ logged_at: 1 });
```

---

## Project File Structure

```
project-root/
├── README.md
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/petallergy/
│       │   ├── App.java
│       │   ├── config/DatabaseConfig.java
│       │   ├── model/          (Pet, SymptomLog, TreatmentLog, EnvFactorLog, LlmQueryLog, ...)
│       │   ├── dao/            (PetDao, SymptomLogDao, TreatmentLogDao, EnvFactorLogDao, ...)
│       │   ├── controller/     (PetController, SymptomController, TreatmentController,
│       │   │                    EnvFactorController, ChatController)
│       │   └── service/OllamaService.java
│       └── resources/
│           ├── public/         (index.html, pets.html, pet-detail.html, chat.html,
│           │                    css/app.css, js/api.js, js/dashboard.js, ...)
│           ├── db/
│           │   ├── schema.js          (mongosh: indexes + validators)
│           │   ├── seed.js            (mongosh: Dec 2025 – Feb 2026 log data)
│           │   └── seed_may_2026.js   (mongosh: May 2026 spring flare data)
│           └── logback.xml
└── docs/
    ├── CS5600DESC_23405_Group2.pdf
    └── FinalReport_23405_Group2.md
```

---

*Submitted for CS 5600 — Advanced Database Systems, Spring 2026*
*Sam Cashion | 700619652 | CRN 23405 | Group 2*
