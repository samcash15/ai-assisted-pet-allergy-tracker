# AI-Assisted Pet Allergy Symptom Tracking System

A database-driven web application for tracking pet allergy symptoms, treatments, and environmental factors over time. Features an LLM-powered chatbot that lets users ask natural language questions about their pet's health data, which are translated into MongoDB aggregation pipelines and summarized in plain English.

Built for **CS 5600 — Advanced Database Systems** (Spring 2026) at the University of California, Merced.

> **Disclaimer:** All seeded data in this application is fictional and generated solely for demonstration purposes. It does not represent real veterinary records or medical data. This application is not a substitute for professional veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian for your pet's health concerns.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
  - [Collections](#collections)
  - [Key Design Decisions](#key-design-decisions)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [1. Install MongoDB](#1-install-mongodb)
  - [2. Install mongosh (MongoDB Shell)](#2-install-mongosh-mongodb-shell)
  - [3. Load the Database](#3-load-the-database)
  - [4. Install Ollama (LLM)](#4-install-ollama-llm)
  - [5. Build and Run the Application](#5-build-and-run-the-application)
- [Using the Application](#using-the-application)
- [Project Structure](#project-structure)
- [Configuration](#configuration)

---

## Overview

This application allows pet owners to:

- **Manage pets** — Add and view pets with species, breed, and date of birth.
- **Log symptoms** — Record allergy symptoms (itching, sneezing, skin redness, etc.) with severity ratings (1-10) and timestamps.
- **Log treatments** — Track medications and therapies (Apoquel, Cytopoint, medicated shampoo, etc.) with dosage and timestamps.
- **Log environmental factors** — Record pollen counts, temperature, humidity, and mold spore levels.
- **Dashboard** — View summary statistics, severity trends, and recent activity at a glance.
- **AI Chat** — Ask natural language questions like "What are Finn's most common symptoms?" or "Is there a correlation between pollen and itching?" The LLM generates a MongoDB aggregation pipeline, executes it against the database, and returns a plain-English summary with the raw data.

The database uses MongoDB with 9 collections. Pets are embedded as an array inside user documents. Log collections denormalize type names and pet names at write time so queries never require `$lookup`. Reference collections stay normalized for easy updates.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Database | MongoDB | 7.0+ |
| Backend | Java + Javalin + MongoDB Driver | Java 17, Javalin 6.7.0, mongodb-driver-sync 5.2.0 |
| Frontend | HTML + Vanilla JavaScript + Tailwind CSS (CDN) | No build step required |
| LLM | Ollama (Llama 3.2, local) | REST API at localhost:11434 |
| Build | Apache Maven (Shade plugin for fat JAR) | 3.9+ |

---

## Database Design

### Collections

9 collections organized into reference and log groups:

| Collection | Purpose |
|---|---|
| `users` | Application users; embeds `pets` array (each user owns their pets) |
| `symptom_types` | Reference: symptom categories (Itching, Sneezing, etc.) |
| `symptom_logs` | Timestamped symptom entries with severity (1–10); embeds `pet_name`, `symptom_type` |
| `treatments` | Reference: medications and therapies (Apoquel, Cytopoint, etc.) |
| `treatment_logs` | Timestamped treatment administration records; embeds `pet_name`, `treatment_name`, `treatment_type` |
| `env_factor_types` | Reference: environmental factor categories (Pollen Count, Temperature, etc.) |
| `env_factor_logs` | Timestamped environmental readings; embeds `pet_name`, `factor_name`, `unit` |
| `llm_query_logs` | Audit log of all AI chat queries and generated aggregation pipelines |
| `counters` | Auto-increment sequence for integer `_id` values on all collections |

### Key Design Decisions

- **Pets embedded in users** — Each `users` document contains a `pets` array. This collocates owner and pet data, avoids a separate collection, and makes fetching all of a user's pets a single document read.
- **Denormalized log documents** — `symptom_logs`, `treatment_logs`, and `env_factor_logs` embed the pet name and type name at write time. This eliminates `$lookup` in aggregation queries, making LLM-generated pipelines simple single-collection operations.
- **Normalized reference collections** — `symptom_types`, `treatments`, and `env_factor_types` are kept separate so a type name can be corrected in one place without bulk-updating log documents.
- **Snake_case field names** — All collection names and document field names use snake_case (e.g., `pet_id`, `logged_at`, `treatment_type`) for consistency with the project design specification.
- **Integer `_id` via counters collection** — A `counters` collection provides atomic auto-increment through `findOneAndUpdate` with `$inc`, replicating the behavior of a SQL `SERIAL` column.
- **Compound indexes** on `(pet_id, logged_at)` for `symptom_logs` and `env_factor_logs`; `(pet_id, administered_at)` for `treatment_logs`; `(pets._id)` for `users`; `(user_id, created_at)` for `llm_query_logs`.
- **All timestamps are UTC** `Date` objects (ISODate).

The mongosh setup scripts are in [`backend/src/main/resources/db/schema.js`](backend/src/main/resources/db/schema.js) and [`seed.js`](backend/src/main/resources/db/seed.js).

---

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Java 17+** — [Download from Oracle](https://www.oracle.com/java/technologies/downloads/)
   ```bash
   java -version
   ```

2. **Apache Maven 3.9+** — [Download from Maven](https://maven.apache.org/download.cgi)
   ```bash
   mvn -version
   ```

3. **MongoDB 7.0+** — [Download from MongoDB](https://www.mongodb.com/try/download/community)
   ```bash
   mongod --version
   ```

4. **Ollama** (for AI Chat feature) — [Download from Ollama](https://ollama.com/download)
   ```bash
   ollama --version
   ```

---

## Setup Instructions

### 1. Install MongoDB

**Windows:**
1. Download the MongoDB Community Server installer from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. Run the installer — select **Complete** setup and check **Install MongoDB as a Service**.
3. MongoDB will start automatically as a Windows service on port `27017`.

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

### 2. Install mongosh (MongoDB Shell)

`mongosh` is a separate download from the MongoDB Server. You need it to load the seed data.

1. Download the zip from [mongodb.com/try/download/shell](https://www.mongodb.com/try/download/shell) — select **Windows**, **zip**.
2. Extract the zip anywhere (e.g., `C:\Tools\mongosh\`).
3. Add the `bin` folder inside the extracted directory to your PATH:
   - Search **"Environment Variables"** in the Start menu → **Edit the system environment variables**
   - Click **Environment Variables** → find **Path** under System variables → click **Edit**
   - Click **New** and add the path to the `bin` folder (e.g., `C:\Tools\mongosh\bin`)
   - Click **OK** on all dialogs
4. Open a **new** terminal and verify:
   ```
   mongosh --version
   ```

> **Windows tip:** If `mongosh` is still not recognized after adding it to PATH, use the full path directly in the commands below (e.g., `C:\Tools\mongosh\bin\mongosh.exe` instead of `mongosh`).

### 3. Load the Database

Run the following three commands from the **project root folder**. They will set up the schema, seed reference data, and load the full log history:

```bash
mongosh pet_allergy_tracker backend/src/main/resources/db/schema.js
mongosh pet_allergy_tracker backend/src/main/resources/db/seed.js
mongosh pet_allergy_tracker backend/src/main/resources/db/seed_may_2026.js
```

Each script prints a confirmation message when it completes. The seed scripts are idempotent — safe to re-run, they skip if data already exists.

> **What each script does:**
> - `schema.js` — **drops the entire database** and recreates collections with indexes and JSON Schema validators. Only run this for a clean reset.
> - `seed.js` — seeds users, reference data, and 60 days of log history (Dec 2025 – Feb 2026)
> - `seed_may_2026.js` — loads May 2026 peak spring allergy season data (two flares, Cytopoint doses)

> **Important:** `schema.js` drops the entire database. If you run it after the app has already started, you must **restart the app** afterward so it can re-seed the users collection.

### 4. Install Ollama (LLM)

The AI Chat feature requires Ollama running locally.

1. Download and install Ollama from [ollama.com/download](https://ollama.com/download).
2. Pull the model:
   ```bash
   ollama pull llama3.2
   ```
3. Verify Ollama is running:
   ```bash
   ollama list
   ```
   You should see `llama3.2` in the output.

> Ollama runs in the background automatically after installation. The AI Chat feature will show a "service unavailable" message if Ollama is not running, but the rest of the application works without it.

### 5. Build and Run the Application

```bash
cd backend
mvn clean package -q
java -jar target/pet-allergy-tracker-1.0-SNAPSHOT.jar
```

The application starts on **http://localhost:7070**.

**If using IntelliJ IDEA**, you can skip the command-line build entirely:

1. Open the `backend/` folder as a project in IntelliJ (or open the root folder and let IntelliJ detect the Maven `pom.xml`).
2. Wait for IntelliJ to finish indexing and resolving Maven dependencies.
3. Navigate to `src/main/java/com/petallergy/App.java`.
4. Right-click the file and select **Run 'App.main()'** (or click the green play button next to the `main` method).
5. The application will compile and start on **http://localhost:7070**.

To browse the database in IntelliJ, open the **Database** tab (right sidebar, or **View > Tool Windows > Database**), click **+** > **Data Source** > **MongoDB**, and enter the following:

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `27017` |
| Database | `pet_allergy_tracker` |

Click **Test Connection** to verify (download the MongoDB driver if prompted), then click **OK**. You can now browse all collections, view documents, and run aggregation queries from within the IDE.

On first startup, the application will:
- Connect to MongoDB at `mongodb://localhost:27017`
- Create the `pet_allergy_tracker` database and all compound indexes
- Seed reference data (users, pets, symptom types, treatments, environmental factor types)
- Begin serving the web interface and REST API

---

## Using the Application

Open **http://localhost:7070** in your browser.

### Pages

| Page | URL | Description |
|---|---|---|
| Dashboard | `/` | Summary cards, severity trends, top symptoms chart, recent activity |
| Pets | `/pets.html` | View and add pets |
| Pet Detail | `/pet-detail.html?petId=1` | Log symptoms, treatments, and environmental factors for a pet |
| AI Chat | `/chat.html` | Ask natural language questions about pet health data |

### Sample AI Chat Questions

- "What are Finn's most common symptoms?"
- "Show average severity by month"
- "Which treatments helped reduce itching?"
- "Is there a correlation between pollen and symptoms?"
- "How is Finn doing today?"

---

## Project Structure

```
project-root/
├── README.md
├── backend/
│   ├── pom.xml                              # Maven build config
│   └── src/main/
│       ├── java/com/petallergy/
│       │   ├── App.java                     # Entry point, Javalin config, route registration
│       │   ├── config/
│       │   │   └── DatabaseConfig.java      # MongoClient + indexes + reference data seed
│       │   ├── model/                       # POJOs (one per collection)
│       │   ├── dao/                         # DAOs using mongodb-driver-sync
│       │   ├── controller/                  # 5 REST controllers
│       │   │   ├── PetController.java
│       │   │   ├── SymptomController.java
│       │   │   ├── TreatmentController.java
│       │   │   ├── EnvFactorController.java
│       │   │   └── ChatController.java
│       │   └── service/
│       │       └── OllamaService.java       # LLM integration (prompt, pipeline gen, execution)
│       └── resources/
│           ├── public/                      # Static frontend (served by Javalin)
│           │   ├── index.html               # Dashboard
│           │   ├── pets.html                # Pet management
│           │   ├── pet-detail.html          # Single pet view with logging
│           │   ├── chat.html                # AI chatbot
│           │   ├── css/app.css
│           │   ├── img/logo.svg
│           │   └── js/
│           │       ├── api.js               # Shared fetch wrapper + utilities
│           │       ├── dashboard.js
│           │       ├── pets.js
│           │       ├── pet-detail.js
│           │       └── chat.js
│           ├── db/
│           │   ├── schema.js                # mongosh: drop + recreate indexes + validators
│           │   ├── seed.js                  # mongosh: 60 days of sample log data (Dec–Feb)
│           │   └── seed_may_2026.js         # mongosh: May 2026 peak spring allergy season
│           └── logback.xml
└── docs/                                    # Project documents
```

---

## Configuration

The application uses environment variables with sensible defaults. No configuration changes are needed for local development.

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URI |
| `MONGODB_DATABASE` | `pet_allergy_tracker` | Database name |

To override (e.g., remote MongoDB Atlas connection):

```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net" \
MONGODB_DATABASE=pet_allergy_tracker \
java -jar target/pet-allergy-tracker-1.0-SNAPSHOT.jar
```

The Ollama endpoint is configured at `http://localhost:11434` (Ollama's default) and the LLM model is `llama3.2`.
