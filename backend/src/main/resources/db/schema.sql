-- ============================================================
-- Pet Allergy Symptom Tracking System — Database Schema
-- CS 5600 Advanced Database Systems — Spring 2026
-- ============================================================
-- All tables are in BCNF. Type/reference data is normalized
-- into separate tables to eliminate update anomalies.
-- TIMESTAMPTZ used throughout (stores UTC internally).
-- ============================================================

-- Drop tables in reverse dependency order for clean re-runs
DROP TABLE IF EXISTS llm_query_logs    CASCADE;
DROP TABLE IF EXISTS env_factor_logs   CASCADE;
DROP TABLE IF EXISTS env_factor_types  CASCADE;
DROP TABLE IF EXISTS treatment_logs    CASCADE;
DROP TABLE IF EXISTS treatments        CASCADE;
DROP TABLE IF EXISTS symptom_logs      CASCADE;
DROP TABLE IF EXISTS symptom_types     CASCADE;
DROP TABLE IF EXISTS pets              CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- 1. USERS
-- Stores application users. Auth is not implemented for this project,
-- but the table exists to demonstrate proper FK relationships.
CREATE TABLE users (
    user_id    SERIAL       PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. PETS
-- Each pet belongs to exactly one user. ON DELETE CASCADE removes
-- the pet (and all its logs) if the owner account is deleted.
CREATE TABLE pets (
    pet_id        SERIAL       PRIMARY KEY,
    user_id       INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    species       VARCHAR(50)  NOT NULL,
    breed         VARCHAR(100),
    date_of_birth DATE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pets_user_id ON pets(user_id);

-- 3. SYMPTOM_TYPES
-- Reference table for symptom categories. Name is UNIQUE to prevent
-- duplicate entries. Normalizing this avoids storing free-text symptom
-- names in every log row (eliminates partial-key dependency).
CREATE TABLE symptom_types (
    symptom_type_id SERIAL       PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT
);

-- 4. SYMPTOM_LOGS
-- Records each observed symptom occurrence. Severity is constrained
-- to 1–10 via CHECK. Composite index on (pet_id, logged_at) supports
-- the primary query pattern: "show symptoms for pet X in date range."
CREATE TABLE symptom_logs (
    symptom_log_id  SERIAL       PRIMARY KEY,
    pet_id          INTEGER      NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    symptom_type_id INTEGER      NOT NULL REFERENCES symptom_types(symptom_type_id),
    severity        INTEGER      NOT NULL CHECK (severity BETWEEN 1 AND 10),
    notes           TEXT,
    logged_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_symptom_logs_pet_date ON symptom_logs(pet_id, logged_at);

-- 5. TREATMENTS
-- Reference table for available treatments. treatment_type is
-- constrained to a known set via CHECK.
CREATE TABLE treatments (
    treatment_id   SERIAL       PRIMARY KEY,
    name           VARCHAR(150) NOT NULL UNIQUE,
    treatment_type VARCHAR(20)  NOT NULL CHECK (treatment_type IN ('medication', 'topical', 'dietary', 'therapy')),
    description    TEXT
);

-- 6. TREATMENT_LOGS
-- Records each treatment administration. FK to treatments uses default
-- RESTRICT (no cascade) so deleting a treatment is blocked if logs
-- reference it — this preserves historical accuracy.
CREATE TABLE treatment_logs (
    treatment_log_id SERIAL       PRIMARY KEY,
    pet_id           INTEGER      NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    treatment_id     INTEGER      NOT NULL REFERENCES treatments(treatment_id),
    dosage           VARCHAR(100),
    notes            TEXT,
    administered_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treatment_logs_pet_date ON treatment_logs(pet_id, administered_at);

-- 7. ENV_FACTOR_TYPES
-- Reference table for environmental factor categories.
-- Unit is nullable (e.g., "index" for pollen has no standard unit).
CREATE TABLE env_factor_types (
    env_factor_type_id SERIAL       PRIMARY KEY,
    name               VARCHAR(100) NOT NULL UNIQUE,
    unit               VARCHAR(50),
    description        TEXT
);

-- 8. ENV_FACTOR_LOGS
-- Records environmental conditions at a point in time.
-- Value is NUMERIC for precision (e.g., pollen 8.3, temp 72.5).
CREATE TABLE env_factor_logs (
    env_factor_log_id  SERIAL       PRIMARY KEY,
    pet_id             INTEGER      NOT NULL REFERENCES pets(pet_id) ON DELETE CASCADE,
    env_factor_type_id INTEGER      NOT NULL REFERENCES env_factor_types(env_factor_type_id),
    value              NUMERIC(10,2) NOT NULL,
    notes              TEXT,
    logged_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_env_factor_logs_pet_date ON env_factor_logs(pet_id, logged_at);

-- 9. LLM_QUERY_LOGS
-- Logs every natural-language query sent to the LLM chatbot, the
-- generated SQL, and the response summary for auditing and debugging.
CREATE TABLE llm_query_logs (
    query_log_id         SERIAL       PRIMARY KEY,
    user_id              INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    natural_language_query TEXT       NOT NULL,
    generated_sql        TEXT,
    response_summary     TEXT,
    success              BOOLEAN      NOT NULL DEFAULT TRUE,
    error_message        TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_llm_query_logs_user ON llm_query_logs(user_id, created_at);
