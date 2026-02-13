-- ============================================================
-- Seed Data — 60 days of realistic allergy tracking for Finn
-- CS 5600 Advanced Database Systems — Spring 2026
-- ============================================================
-- Story: Finn (Golden Retriever) has seasonal allergies that
-- flare when pollen counts are high. Treatment with Apoquel
-- (daily) and Cytopoint (monthly injection) brings relief.
-- Severity spikes correlate with pollen > 8.0.
-- ============================================================

-- Idempotent: only insert if tables are empty
-- (schema.sql drops and recreates tables, so this is safe)

-- User
INSERT INTO users (user_id, username, email)
VALUES (1, 'sam', 'sam@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Reset sequence so next insert gets id=2
SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id),0) FROM users));

-- Pet: Finn
INSERT INTO pets (pet_id, user_id, name, species, breed, date_of_birth)
VALUES (1, 1, 'Finn', 'Dog', 'Golden Retriever', '2021-03-15')
ON CONFLICT (pet_id) DO NOTHING;

SELECT setval('pets_pet_id_seq', (SELECT COALESCE(MAX(pet_id),0) FROM pets));

-- Symptom Types
INSERT INTO symptom_types (symptom_type_id, name, description) VALUES
    (1, 'Itching',            'Generalized scratching and itching behavior'),
    (2, 'Skin Redness',       'Visible redness or inflammation on the skin'),
    (3, 'Sneezing',           'Repeated sneezing episodes'),
    (4, 'Ear Inflammation',   'Redness, swelling, or discharge inside the ears'),
    (5, 'Paw Licking',        'Excessive licking or chewing of paws'),
    (6, 'Watery Eyes',        'Excessive tearing or eye discharge'),
    (7, 'Nasal Discharge',    'Runny nose or nasal drip')
ON CONFLICT (symptom_type_id) DO NOTHING;

SELECT setval('symptom_types_symptom_type_id_seq', (SELECT COALESCE(MAX(symptom_type_id),0) FROM symptom_types));

-- Treatments
INSERT INTO treatments (treatment_id, name, treatment_type, description) VALUES
    (1, 'Apoquel',               'medication', 'Oclacitinib — daily oral JAK inhibitor for allergic itch'),
    (2, 'Cytopoint Injection',   'medication', 'Lokivetmab — monthly injectable antibody targeting IL-31'),
    (3, 'Medicated Shampoo',     'topical',    'Chlorhexidine/ketoconazole shampoo for skin infections'),
    (4, 'Grain-Free Diet',       'dietary',    'Limited-ingredient grain-free kibble to reduce food allergens'),
    (5, 'Hydrocortisone Cream',  'topical',    'OTC 1% hydrocortisone for localized hot spots'),
    (6, 'Allergy Immunotherapy', 'therapy',    'Subcutaneous allergy shots based on intradermal testing')
ON CONFLICT (treatment_id) DO NOTHING;

SELECT setval('treatments_treatment_id_seq', (SELECT COALESCE(MAX(treatment_id),0) FROM treatments));

-- Environmental Factor Types
INSERT INTO env_factor_types (env_factor_type_id, name, unit, description) VALUES
    (1, 'Pollen Count',     'index',   'Daily pollen index (0-12 scale)'),
    (2, 'Temperature',      '°F',      'Outdoor temperature in Fahrenheit'),
    (3, 'Humidity',          '%',       'Relative humidity percentage'),
    (4, 'Mold Spore Count', 'index',   'Daily mold spore index (0-12 scale)')
ON CONFLICT (env_factor_type_id) DO NOTHING;

SELECT setval('env_factor_types_env_factor_type_id_seq', (SELECT COALESCE(MAX(env_factor_type_id),0) FROM env_factor_types));

-- ============================================================
-- SYMPTOM LOGS — ~130 rows over 60 days
-- Pattern: baseline severity 2-4, spikes to 6-9 on high-pollen
-- days (roughly days 8-15, 30-38, 50-55), drops after treatment
-- ============================================================
INSERT INTO symptom_logs (pet_id, symptom_type_id, severity, notes, logged_at) VALUES
-- Week 1: Baseline (low pollen, stable)
(1, 1, 3, 'Mild scratching after walk', '2025-12-15 08:30:00-06'),
(1, 5, 2, 'Brief paw licking after breakfast', '2025-12-15 12:00:00-06'),
(1, 1, 2, 'Occasional scratching', '2025-12-16 09:00:00-06'),
(1, 2, 2, 'Slight redness on belly', '2025-12-17 10:15:00-06'),
(1, 1, 3, 'Scratching at ears and belly', '2025-12-18 08:45:00-06'),
(1, 5, 3, 'Paw licking noticed after evening walk', '2025-12-18 18:30:00-06'),
(1, 1, 2, 'Light scratching', '2025-12-19 09:00:00-06'),
(1, 6, 2, 'Mild watery eyes in morning', '2025-12-20 07:30:00-06'),
(1, 1, 3, 'Moderate scratching', '2025-12-21 08:00:00-06'),

-- Week 2: First pollen spike (days 8-15)
(1, 1, 5, 'Increased scratching — pollen seems high', '2025-12-22 08:00:00-06'),
(1, 2, 5, 'Redness on belly and inner thighs', '2025-12-22 12:00:00-06'),
(1, 5, 5, 'Constant paw licking', '2025-12-22 18:00:00-06'),
(1, 1, 7, 'Intense itching — could not settle', '2025-12-23 08:30:00-06'),
(1, 3, 4, 'Sneezing fits after going outside', '2025-12-23 10:00:00-06'),
(1, 4, 5, 'Ears look red and irritated', '2025-12-23 14:00:00-06'),
(1, 2, 6, 'Belly very red and warm to touch', '2025-12-23 18:00:00-06'),
(1, 1, 8, 'Worst itching day — scratching nonstop', '2025-12-24 08:00:00-06'),
(1, 5, 7, 'Paw licking raw spots developing', '2025-12-24 12:00:00-06'),
(1, 6, 5, 'Eyes very watery and squinting', '2025-12-24 16:00:00-06'),
(1, 7, 4, 'Nasal discharge noticed', '2025-12-24 18:00:00-06'),
(1, 1, 8, 'Still very itchy despite Apoquel', '2025-12-25 08:30:00-06'),
(1, 2, 7, 'Hot spots forming on flanks', '2025-12-25 12:00:00-06'),
(1, 4, 6, 'Ear shaking frequently', '2025-12-25 16:00:00-06'),
(1, 1, 6, 'Itching improving slightly', '2025-12-26 09:00:00-06'),
(1, 5, 5, 'Still licking paws but less frantic', '2025-12-26 14:00:00-06'),
(1, 3, 3, 'Occasional sneeze', '2025-12-26 18:00:00-06'),
(1, 1, 5, 'Continued improvement', '2025-12-27 08:00:00-06'),
(1, 2, 4, 'Redness fading', '2025-12-27 12:00:00-06'),
(1, 1, 4, 'Moderate itch — manageable', '2025-12-28 09:00:00-06'),
(1, 6, 3, 'Eyes clearing up', '2025-12-28 14:00:00-06'),

-- Week 3-4: Recovery period (pollen drops, Cytopoint given day 14)
(1, 1, 3, 'Much better after Cytopoint injection', '2025-12-29 08:00:00-06'),
(1, 5, 2, 'Minimal paw licking', '2025-12-29 18:00:00-06'),
(1, 1, 2, 'Very calm today', '2025-12-30 09:00:00-06'),
(1, 2, 2, 'Skin looks healthy', '2025-12-31 10:00:00-06'),
(1, 1, 2, 'Doing great — minimal symptoms', '2026-01-01 08:30:00-06'),
(1, 1, 2, 'Stable', '2026-01-02 09:00:00-06'),
(1, 5, 2, 'Slight paw licking after rain', '2026-01-03 14:00:00-06'),
(1, 1, 3, 'Mild uptick in scratching', '2026-01-04 08:00:00-06'),
(1, 2, 2, 'Minimal redness', '2026-01-05 10:00:00-06'),
(1, 1, 2, 'Good day', '2026-01-06 09:00:00-06'),
(1, 6, 2, 'Slight eye watering in wind', '2026-01-07 11:00:00-06'),
(1, 1, 3, 'Little more scratching today', '2026-01-08 08:00:00-06'),
(1, 3, 2, 'One sneeze after rolling in grass', '2026-01-09 15:00:00-06'),
(1, 1, 2, 'Quiet day', '2026-01-10 09:00:00-06'),
(1, 5, 2, 'Minimal', '2026-01-11 08:30:00-06'),

-- Week 5-6: Second pollen spike (days 30-38)
(1, 1, 4, 'Scratching picking up again', '2026-01-13 08:00:00-06'),
(1, 2, 3, 'Belly redness returning', '2026-01-13 14:00:00-06'),
(1, 1, 6, 'Significant itch increase — pollen rising', '2026-01-14 08:30:00-06'),
(1, 5, 5, 'Paw licking resumed', '2026-01-14 12:00:00-06'),
(1, 3, 4, 'Multiple sneezing episodes', '2026-01-14 16:00:00-06'),
(1, 1, 7, 'Bad allergy day', '2026-01-15 08:00:00-06'),
(1, 2, 6, 'Red inflamed patches on legs', '2026-01-15 12:00:00-06'),
(1, 4, 5, 'Ears red and scratching at them', '2026-01-15 17:00:00-06'),
(1, 1, 8, 'Peak severity — very uncomfortable', '2026-01-16 08:00:00-06'),
(1, 5, 7, 'Paw chewing — applied hydrocortisone', '2026-01-16 11:00:00-06'),
(1, 6, 5, 'Watery eyes all day', '2026-01-16 15:00:00-06'),
(1, 7, 4, 'Clear nasal discharge', '2026-01-16 18:00:00-06'),
(1, 1, 7, 'Still rough but Apoquel helping some', '2026-01-17 08:30:00-06'),
(1, 2, 6, 'Skin still inflamed', '2026-01-17 12:00:00-06'),
(1, 4, 5, 'Ear inflammation persisting', '2026-01-17 17:00:00-06'),
(1, 1, 6, 'Slowly improving', '2026-01-18 09:00:00-06'),
(1, 5, 4, 'Paw licking reduced', '2026-01-18 14:00:00-06'),
(1, 3, 3, 'Sneezing less frequent', '2026-01-18 18:00:00-06'),
(1, 1, 5, 'Better day', '2026-01-19 08:00:00-06'),
(1, 2, 4, 'Redness receding', '2026-01-19 12:00:00-06'),
(1, 1, 4, 'Continued improvement post-spike', '2026-01-20 09:00:00-06'),
(1, 6, 3, 'Eyes much better', '2026-01-20 14:00:00-06'),
(1, 1, 3, 'Nearly back to baseline', '2026-01-21 08:30:00-06'),
(1, 5, 2, 'Paw licking minimal', '2026-01-21 18:00:00-06'),

-- Week 7: Stable period
(1, 1, 2, 'Doing well', '2026-01-22 09:00:00-06'),
(1, 2, 2, 'Skin clear', '2026-01-23 10:00:00-06'),
(1, 1, 3, 'Mild scratch after dog park', '2026-01-24 16:00:00-06'),
(1, 5, 2, 'Brief paw lick', '2026-01-25 08:00:00-06'),
(1, 1, 2, 'Good day', '2026-01-26 09:00:00-06'),
(1, 1, 2, 'Stable and comfortable', '2026-01-27 08:30:00-06'),
(1, 3, 2, 'One sneeze', '2026-01-28 11:00:00-06'),

-- Week 8-9: Third spike (days 50-55) — shorter due to Cytopoint
(1, 1, 5, 'Pollen back up — scratching increase', '2026-02-02 08:00:00-06'),
(1, 2, 4, 'Belly redness', '2026-02-02 14:00:00-06'),
(1, 5, 5, 'Paw licking resumed', '2026-02-02 18:00:00-06'),
(1, 1, 7, 'Significant flare', '2026-02-03 08:30:00-06'),
(1, 4, 5, 'Ears inflamed again', '2026-02-03 12:00:00-06'),
(1, 3, 4, 'Sneezing fits after yard time', '2026-02-03 16:00:00-06'),
(1, 1, 7, 'Peak of this episode', '2026-02-04 08:00:00-06'),
(1, 2, 6, 'Hot spots on belly', '2026-02-04 12:00:00-06'),
(1, 6, 5, 'Watery eyes', '2026-02-04 16:00:00-06'),
(1, 1, 6, 'Cytopoint given — waiting for effect', '2026-02-05 08:00:00-06'),
(1, 5, 5, 'Still licking paws', '2026-02-05 14:00:00-06'),
(1, 1, 4, 'Cytopoint kicking in — much better', '2026-02-06 09:00:00-06'),
(1, 2, 3, 'Redness fading fast', '2026-02-06 14:00:00-06'),
(1, 1, 3, 'Recovery faster this time', '2026-02-07 08:00:00-06'),
(1, 5, 2, 'Paws healing', '2026-02-07 18:00:00-06'),

-- Final days: back to baseline
(1, 1, 2, 'Back to normal', '2026-02-08 09:00:00-06'),
(1, 2, 2, 'Skin clear and healthy', '2026-02-09 10:00:00-06'),
(1, 1, 2, 'Doing great', '2026-02-10 08:30:00-06'),
(1, 5, 2, 'Minimal symptoms', '2026-02-11 09:00:00-06'),
(1, 1, 2, 'Comfortable and happy', '2026-02-12 08:00:00-06'),
(1, 6, 2, 'Eyes clear', '2026-02-12 14:00:00-06'),
(1, 1, 2, 'Great day', '2026-02-13 09:00:00-06');

-- ============================================================
-- TREATMENT LOGS — ~48 rows
-- Daily Apoquel, weekly medicated shampoo, monthly Cytopoint,
-- grain-free diet ongoing, hydrocortisone as needed during flares
-- ============================================================
INSERT INTO treatment_logs (pet_id, treatment_id, dosage, notes, administered_at) VALUES
-- Daily Apoquel (16mg, one tablet) — every day for 60 days (sampling key dates)
(1, 1, '16mg tablet', 'Morning dose with food', '2025-12-15 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-16 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-17 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-18 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-19 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-20 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-21 07:00:00-06'),
(1, 1, '16mg tablet', 'Increased to AM dose during flare', '2025-12-22 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-23 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-24 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-25 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-26 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-27 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2025-12-28 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-01 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-04 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-08 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-13 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-14 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-15 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-16 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-17 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-18 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-19 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-20 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-01-25 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-02-01 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-02-02 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-02-03 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-02-04 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-02-05 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-02-08 07:00:00-06'),
(1, 1, '16mg tablet', NULL, '2026-02-12 07:00:00-06'),

-- Cytopoint Injection — monthly (2 doses in 60-day window)
(1, 2, '40mg injection', 'Monthly Cytopoint — administered at vet', '2025-12-28 14:00:00-06'),
(1, 2, '40mg injection', 'Monthly Cytopoint — good response last month', '2026-02-05 14:00:00-06'),

-- Medicated Shampoo — weekly baths
(1, 3, 'Full body wash', 'Weekly bath — 10 min contact time', '2025-12-15 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2025-12-22 17:00:00-06'),
(1, 3, 'Full body wash', 'Extra wash during flare week', '2025-12-25 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2025-12-29 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2026-01-05 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2026-01-12 17:00:00-06'),
(1, 3, 'Full body wash', 'Extra wash — second flare', '2026-01-16 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2026-01-19 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2026-01-26 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2026-02-02 17:00:00-06'),
(1, 3, 'Full body wash', NULL, '2026-02-09 17:00:00-06'),

-- Grain-Free Diet — daily (log start date and periodic check-ins)
(1, 4, '2 cups daily', 'Started grain-free diet', '2025-12-15 07:30:00-06'),
(1, 4, '2 cups daily', 'Tolerating diet well', '2026-01-01 07:30:00-06'),
(1, 4, '2 cups daily', 'Continuing grain-free — no GI issues', '2026-02-01 07:30:00-06'),

-- Hydrocortisone Cream — as needed during flares
(1, 5, 'Thin layer on affected area', 'Applied to hot spots on belly', '2025-12-24 20:00:00-06'),
(1, 5, 'Thin layer on affected area', 'Applied to paw pads', '2025-12-25 08:00:00-06'),
(1, 5, 'Thin layer on affected area', 'Hot spots on legs', '2026-01-16 20:00:00-06'),
(1, 5, 'Thin layer on affected area', 'Paw pads during second flare', '2026-01-17 08:00:00-06'),
(1, 5, 'Thin layer on affected area', 'Belly hot spots — third episode', '2026-02-04 20:00:00-06');

-- ============================================================
-- ENVIRONMENTAL FACTOR LOGS — ~75 rows
-- Daily pollen + temperature, periodic humidity + mold
-- Pollen spikes on days 8-15, 30-38, 50-55 correlate with symptoms
-- ============================================================
INSERT INTO env_factor_logs (pet_id, env_factor_type_id, value, notes, logged_at) VALUES
-- Week 1: Low pollen baseline
(1, 1, 3.2, 'Low pollen day', '2025-12-15 06:00:00-06'),
(1, 2, 45.0, NULL, '2025-12-15 06:00:00-06'),
(1, 3, 55.0, NULL, '2025-12-15 06:00:00-06'),
(1, 1, 2.8, NULL, '2025-12-16 06:00:00-06'),
(1, 2, 42.0, NULL, '2025-12-16 06:00:00-06'),
(1, 1, 3.5, NULL, '2025-12-17 06:00:00-06'),
(1, 2, 48.0, NULL, '2025-12-17 06:00:00-06'),
(1, 1, 3.0, NULL, '2025-12-18 06:00:00-06'),
(1, 2, 50.0, NULL, '2025-12-18 06:00:00-06'),
(1, 3, 60.0, NULL, '2025-12-18 06:00:00-06'),
(1, 1, 4.1, 'Pollen rising', '2025-12-19 06:00:00-06'),
(1, 2, 52.0, NULL, '2025-12-19 06:00:00-06'),
(1, 1, 5.0, NULL, '2025-12-20 06:00:00-06'),
(1, 2, 55.0, NULL, '2025-12-20 06:00:00-06'),
(1, 1, 5.5, 'Pollen trending up', '2025-12-21 06:00:00-06'),
(1, 2, 54.0, NULL, '2025-12-21 06:00:00-06'),
(1, 3, 65.0, 'Humid day', '2025-12-21 06:00:00-06'),

-- Week 2: First pollen spike
(1, 1, 8.2, 'HIGH pollen alert', '2025-12-22 06:00:00-06'),
(1, 2, 58.0, NULL, '2025-12-22 06:00:00-06'),
(1, 4, 4.5, NULL, '2025-12-22 06:00:00-06'),
(1, 1, 9.5, 'Very high pollen', '2025-12-23 06:00:00-06'),
(1, 2, 62.0, NULL, '2025-12-23 06:00:00-06'),
(1, 3, 70.0, NULL, '2025-12-23 06:00:00-06'),
(1, 1, 10.2, 'Peak pollen — extreme', '2025-12-24 06:00:00-06'),
(1, 2, 65.0, NULL, '2025-12-24 06:00:00-06'),
(1, 4, 5.8, 'Mold also elevated', '2025-12-24 06:00:00-06'),
(1, 1, 9.8, 'Still very high', '2025-12-25 06:00:00-06'),
(1, 2, 63.0, NULL, '2025-12-25 06:00:00-06'),
(1, 1, 7.5, 'Dropping slightly', '2025-12-26 06:00:00-06'),
(1, 2, 58.0, NULL, '2025-12-26 06:00:00-06'),
(1, 3, 62.0, NULL, '2025-12-26 06:00:00-06'),
(1, 1, 5.8, 'Continuing to drop', '2025-12-27 06:00:00-06'),
(1, 2, 52.0, NULL, '2025-12-27 06:00:00-06'),
(1, 1, 4.2, 'Back toward normal', '2025-12-28 06:00:00-06'),
(1, 2, 48.0, NULL, '2025-12-28 06:00:00-06'),
(1, 4, 3.0, NULL, '2025-12-28 06:00:00-06'),

-- Week 3-4: Low pollen recovery
(1, 1, 3.0, 'Low pollen', '2025-12-29 06:00:00-06'),
(1, 2, 44.0, NULL, '2025-12-29 06:00:00-06'),
(1, 1, 2.5, NULL, '2025-12-30 06:00:00-06'),
(1, 2, 40.0, NULL, '2025-12-30 06:00:00-06'),
(1, 1, 2.8, NULL, '2025-12-31 06:00:00-06'),
(1, 2, 38.0, 'Cold day', '2025-12-31 06:00:00-06'),
(1, 3, 45.0, 'Dry winter air', '2025-12-31 06:00:00-06'),
(1, 1, 3.0, NULL, '2026-01-01 06:00:00-06'),
(1, 2, 42.0, NULL, '2026-01-01 06:00:00-06'),
(1, 1, 3.2, NULL, '2026-01-04 06:00:00-06'),
(1, 2, 46.0, NULL, '2026-01-04 06:00:00-06'),
(1, 1, 3.5, NULL, '2026-01-08 06:00:00-06'),
(1, 2, 50.0, NULL, '2026-01-08 06:00:00-06'),
(1, 3, 55.0, NULL, '2026-01-08 06:00:00-06'),
(1, 4, 2.0, NULL, '2026-01-08 06:00:00-06'),
(1, 1, 4.0, 'Pollen starting to rise again', '2026-01-11 06:00:00-06'),
(1, 2, 54.0, NULL, '2026-01-11 06:00:00-06'),

-- Week 5-6: Second pollen spike
(1, 1, 6.5, 'Pollen climbing', '2026-01-13 06:00:00-06'),
(1, 2, 58.0, NULL, '2026-01-13 06:00:00-06'),
(1, 1, 8.8, 'High pollen', '2026-01-14 06:00:00-06'),
(1, 2, 60.0, NULL, '2026-01-14 06:00:00-06'),
(1, 3, 68.0, NULL, '2026-01-14 06:00:00-06'),
(1, 1, 9.5, 'Very high — second spike', '2026-01-15 06:00:00-06'),
(1, 2, 64.0, NULL, '2026-01-15 06:00:00-06'),
(1, 4, 5.5, 'Mold elevated too', '2026-01-15 06:00:00-06'),
(1, 1, 10.5, 'Peak pollen — worst of second spike', '2026-01-16 06:00:00-06'),
(1, 2, 66.0, NULL, '2026-01-16 06:00:00-06'),
(1, 1, 9.0, 'Still high', '2026-01-17 06:00:00-06'),
(1, 2, 62.0, NULL, '2026-01-17 06:00:00-06'),
(1, 3, 70.0, 'Muggy day', '2026-01-17 06:00:00-06'),
(1, 1, 7.0, 'Dropping', '2026-01-18 06:00:00-06'),
(1, 2, 58.0, NULL, '2026-01-18 06:00:00-06'),
(1, 1, 5.5, 'Improving', '2026-01-19 06:00:00-06'),
(1, 2, 55.0, NULL, '2026-01-19 06:00:00-06'),
(1, 4, 3.5, NULL, '2026-01-19 06:00:00-06'),
(1, 1, 4.0, 'Near normal', '2026-01-20 06:00:00-06'),
(1, 2, 50.0, NULL, '2026-01-20 06:00:00-06'),
(1, 1, 3.0, 'Normal', '2026-01-21 06:00:00-06'),
(1, 2, 48.0, NULL, '2026-01-21 06:00:00-06'),
(1, 3, 52.0, NULL, '2026-01-21 06:00:00-06'),

-- Week 7: Stable
(1, 1, 2.5, NULL, '2026-01-25 06:00:00-06'),
(1, 2, 44.0, NULL, '2026-01-25 06:00:00-06'),
(1, 1, 3.0, NULL, '2026-01-28 06:00:00-06'),
(1, 2, 46.0, NULL, '2026-01-28 06:00:00-06'),
(1, 4, 2.0, NULL, '2026-01-28 06:00:00-06'),

-- Week 8-9: Third spike (shorter)
(1, 1, 5.0, 'Pollen rising again', '2026-02-01 06:00:00-06'),
(1, 2, 52.0, NULL, '2026-02-01 06:00:00-06'),
(1, 1, 8.0, 'High pollen', '2026-02-02 06:00:00-06'),
(1, 2, 58.0, NULL, '2026-02-02 06:00:00-06'),
(1, 3, 65.0, NULL, '2026-02-02 06:00:00-06'),
(1, 1, 9.8, 'Very high — third spike peak', '2026-02-03 06:00:00-06'),
(1, 2, 62.0, NULL, '2026-02-03 06:00:00-06'),
(1, 4, 6.0, 'Mold spike too', '2026-02-03 06:00:00-06'),
(1, 1, 9.2, 'Still high', '2026-02-04 06:00:00-06'),
(1, 2, 60.0, NULL, '2026-02-04 06:00:00-06'),
(1, 1, 7.0, 'Dropping after rain', '2026-02-05 06:00:00-06'),
(1, 2, 55.0, NULL, '2026-02-05 06:00:00-06'),
(1, 1, 4.5, 'Post-rain drop', '2026-02-06 06:00:00-06'),
(1, 2, 50.0, NULL, '2026-02-06 06:00:00-06'),
(1, 3, 58.0, NULL, '2026-02-06 06:00:00-06'),
(1, 1, 3.0, 'Back to normal', '2026-02-07 06:00:00-06'),
(1, 2, 48.0, NULL, '2026-02-07 06:00:00-06'),

-- Final days: low pollen
(1, 1, 2.5, NULL, '2026-02-08 06:00:00-06'),
(1, 2, 45.0, NULL, '2026-02-08 06:00:00-06'),
(1, 1, 2.0, NULL, '2026-02-10 06:00:00-06'),
(1, 2, 44.0, NULL, '2026-02-10 06:00:00-06'),
(1, 3, 50.0, NULL, '2026-02-10 06:00:00-06'),
(1, 4, 1.5, 'Low mold', '2026-02-10 06:00:00-06'),
(1, 1, 2.2, NULL, '2026-02-12 06:00:00-06'),
(1, 2, 46.0, NULL, '2026-02-12 06:00:00-06'),
(1, 1, 2.0, 'Beautiful low-pollen day', '2026-02-13 06:00:00-06'),
(1, 2, 50.0, NULL, '2026-02-13 06:00:00-06');
