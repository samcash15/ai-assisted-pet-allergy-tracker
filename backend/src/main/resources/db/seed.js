// ============================================================
// Seed Data — 60 days of realistic allergy tracking for Finn
// CS 5600 Advanced Database Systems — Spring 2026
// ============================================================
// Story: Finn (Golden Retriever) has seasonal allergies that
// flare when pollen counts are high. Treatment with Apoquel
// (daily) and Cytopoint (monthly injection) brings relief.
// Severity spikes correlate with pollen > 8.0.
// Covers Dec 15 2025 – Feb 13 2026.
// ============================================================
// Run with: mongosh pet_allergy_tracker seed.js
// NOTE: The Java app seeds reference data on first startup.
//       This file loads the full log history (symptom_logs,
//       treatment_logs, env_factor_logs) for the demo dataset.
// ============================================================

if (db.symptom_logs.countDocuments() > 0) {
  print("Seed data already present — skipping.");
  quit();
}

// ── Reference data (idempotent) ───────────────────────────────

db.users.updateOne({ _id: 1 },
  { $setOnInsert: {
    _id: 1, username: "sam", email: "sam@example.com",
    created_at: new Date(),
    pets: [{
      _id: 1, name: "Finn", species: "Dog", breed: "Golden Retriever",
      date_of_birth: ISODate("2021-03-15T00:00:00Z"),
      created_at: new Date()
    }]
  }},
  { upsert: true });

db.symptom_types.insertMany([
  { _id: 1, name: "Itching",           description: "Generalized scratching and itching behavior" },
  { _id: 2, name: "Skin Redness",      description: "Visible redness or inflammation on the skin" },
  { _id: 3, name: "Sneezing",          description: "Repeated sneezing episodes" },
  { _id: 4, name: "Ear Inflammation",  description: "Redness, swelling, or discharge inside the ears" },
  { _id: 5, name: "Paw Licking",       description: "Excessive licking or chewing of paws" },
  { _id: 6, name: "Watery Eyes",       description: "Excessive tearing or eye discharge" },
  { _id: 7, name: "Nasal Discharge",   description: "Runny nose or nasal drip" }
], { ordered: false });

db.treatments.insertMany([
  { _id: 1, name: "Apoquel",               treatment_type: "medication", description: "Oclacitinib — daily oral JAK inhibitor for allergic itch" },
  { _id: 2, name: "Cytopoint Injection",   treatment_type: "medication", description: "Lokivetmab — monthly injectable antibody targeting IL-31" },
  { _id: 3, name: "Medicated Shampoo",     treatment_type: "topical",    description: "Chlorhexidine/ketoconazole shampoo for skin infections" },
  { _id: 4, name: "Grain-Free Diet",       treatment_type: "dietary",    description: "Limited-ingredient grain-free kibble to reduce food allergens" },
  { _id: 5, name: "Hydrocortisone Cream",  treatment_type: "topical",    description: "OTC 1% hydrocortisone for localized hot spots" },
  { _id: 6, name: "Allergy Immunotherapy", treatment_type: "therapy",    description: "Subcutaneous allergy shots based on intradermal testing" }
], { ordered: false });

db.env_factor_types.insertMany([
  { _id: 1, name: "Pollen Count",     unit: "index", description: "Daily pollen index (0-12 scale)" },
  { _id: 2, name: "Temperature",      unit: "°F",    description: "Outdoor temperature in Fahrenheit" },
  { _id: 3, name: "Humidity",         unit: "%",     description: "Relative humidity percentage" },
  { _id: 4, name: "Mold Spore Count", unit: "index", description: "Daily mold spore index (0-12 scale)" }
], { ordered: false });

// ── Symptom Logs ─────────────────────────────────────────────
// Pattern: baseline severity 2-4, spikes to 6-9 on high-pollen
// days (days 8-15, 30-38, 50-55), drops after treatment

let sl = [
  // Week 1: Baseline (low pollen, stable)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Mild scratching after walk",logged_at:ISODate("2025-12-15T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Brief paw licking after breakfast",logged_at:ISODate("2025-12-15T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Occasional scratching",logged_at:ISODate("2025-12-16T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Slight redness on belly",logged_at:ISODate("2025-12-17T16:15:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Scratching at ears and belly",logged_at:ISODate("2025-12-18T14:45:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:3,notes:"Paw licking noticed after evening walk",logged_at:ISODate("2025-12-18T00:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Light scratching",logged_at:ISODate("2025-12-19T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:2,notes:"Mild watery eyes in morning",logged_at:ISODate("2025-12-20T13:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Moderate scratching",logged_at:ISODate("2025-12-21T14:00:00Z")},

  // Week 2: First pollen spike (days 8-15)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:5,notes:"Increased scratching — pollen seems high",logged_at:ISODate("2025-12-22T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:5,notes:"Redness on belly and inner thighs",logged_at:ISODate("2025-12-22T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Constant paw licking",logged_at:ISODate("2025-12-23T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Intense itching — could not settle",logged_at:ISODate("2025-12-23T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:4,notes:"Sneezing fits after going outside",logged_at:ISODate("2025-12-23T16:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:5,notes:"Ears look red and irritated",logged_at:ISODate("2025-12-23T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:6,notes:"Belly very red and warm to touch",logged_at:ISODate("2025-12-24T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:8,notes:"Worst itching day — scratching nonstop",logged_at:ISODate("2025-12-24T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:7,notes:"Paw licking raw spots developing",logged_at:ISODate("2025-12-24T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:5,notes:"Eyes very watery and squinting",logged_at:ISODate("2025-12-24T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Nasal Discharge",severity:4,notes:"Nasal discharge noticed",logged_at:ISODate("2025-12-25T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:8,notes:"Still very itchy despite Apoquel",logged_at:ISODate("2025-12-25T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:7,notes:"Hot spots forming on flanks",logged_at:ISODate("2025-12-25T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:6,notes:"Ear shaking frequently",logged_at:ISODate("2025-12-25T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Itching improving slightly",logged_at:ISODate("2025-12-26T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Still licking paws but less frantic",logged_at:ISODate("2025-12-26T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:3,notes:"Occasional sneeze",logged_at:ISODate("2025-12-27T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:5,notes:"Continued improvement",logged_at:ISODate("2025-12-27T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:4,notes:"Redness fading",logged_at:ISODate("2025-12-27T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Moderate itch — manageable",logged_at:ISODate("2025-12-28T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:3,notes:"Eyes clearing up",logged_at:ISODate("2025-12-28T20:00:00Z")},

  // Week 3-4: Recovery (Cytopoint given day 14)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Much better after Cytopoint injection",logged_at:ISODate("2025-12-29T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Minimal paw licking",logged_at:ISODate("2025-12-30T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Very calm today",logged_at:ISODate("2025-12-30T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Skin looks healthy",logged_at:ISODate("2025-12-31T16:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Doing great — minimal symptoms",logged_at:ISODate("2026-01-01T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Stable",logged_at:ISODate("2026-01-02T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Slight paw licking after rain",logged_at:ISODate("2026-01-03T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Mild uptick in scratching",logged_at:ISODate("2026-01-04T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Minimal redness",logged_at:ISODate("2026-01-05T16:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Good day",logged_at:ISODate("2026-01-06T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:2,notes:"Slight eye watering in wind",logged_at:ISODate("2026-01-07T17:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Little more scratching today",logged_at:ISODate("2026-01-08T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:2,notes:"One sneeze after rolling in grass",logged_at:ISODate("2026-01-09T21:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Quiet day",logged_at:ISODate("2026-01-10T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Minimal",logged_at:ISODate("2026-01-11T14:30:00Z")},

  // Week 5-6: Second pollen spike (days 30-38)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Scratching picking up again",logged_at:ISODate("2026-01-13T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:3,notes:"Belly redness returning",logged_at:ISODate("2026-01-13T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Significant itch increase — pollen rising",logged_at:ISODate("2026-01-14T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Paw licking resumed",logged_at:ISODate("2026-01-14T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:4,notes:"Multiple sneezing episodes",logged_at:ISODate("2026-01-14T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Bad allergy day",logged_at:ISODate("2026-01-15T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:6,notes:"Red inflamed patches on legs",logged_at:ISODate("2026-01-15T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:5,notes:"Ears red and scratching at them",logged_at:ISODate("2026-01-15T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:8,notes:"Peak severity — very uncomfortable",logged_at:ISODate("2026-01-16T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:7,notes:"Paw chewing — applied hydrocortisone",logged_at:ISODate("2026-01-16T17:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:5,notes:"Watery eyes all day",logged_at:ISODate("2026-01-16T21:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Nasal Discharge",severity:4,notes:"Clear nasal discharge",logged_at:ISODate("2026-01-17T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Still rough but Apoquel helping some",logged_at:ISODate("2026-01-17T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:6,notes:"Skin still inflamed",logged_at:ISODate("2026-01-17T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:5,notes:"Ear inflammation persisting",logged_at:ISODate("2026-01-17T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Slowly improving",logged_at:ISODate("2026-01-18T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:4,notes:"Paw licking reduced",logged_at:ISODate("2026-01-18T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:3,notes:"Sneezing less frequent",logged_at:ISODate("2026-01-19T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:5,notes:"Better day",logged_at:ISODate("2026-01-19T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:4,notes:"Redness receding",logged_at:ISODate("2026-01-19T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Continued improvement post-spike",logged_at:ISODate("2026-01-20T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:3,notes:"Eyes much better",logged_at:ISODate("2026-01-20T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Nearly back to baseline",logged_at:ISODate("2026-01-21T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Paw licking minimal",logged_at:ISODate("2026-01-22T00:00:00Z")},

  // Week 7: Stable period
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Doing well",logged_at:ISODate("2026-01-22T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Skin clear",logged_at:ISODate("2026-01-23T16:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Mild scratch after dog park",logged_at:ISODate("2026-01-24T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Brief paw lick",logged_at:ISODate("2026-01-25T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Good day",logged_at:ISODate("2026-01-26T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Stable and comfortable",logged_at:ISODate("2026-01-27T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:2,notes:"One sneeze",logged_at:ISODate("2026-01-28T17:00:00Z")},

  // Week 8-9: Third spike (shorter due to Cytopoint)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:5,notes:"Pollen back up — scratching increase",logged_at:ISODate("2026-02-02T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:4,notes:"Belly redness",logged_at:ISODate("2026-02-02T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Paw licking resumed",logged_at:ISODate("2026-02-03T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Significant flare",logged_at:ISODate("2026-02-03T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:5,notes:"Ears inflamed again",logged_at:ISODate("2026-02-03T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:4,notes:"Sneezing fits after yard time",logged_at:ISODate("2026-02-03T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Peak of this episode",logged_at:ISODate("2026-02-04T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:6,notes:"Hot spots on belly",logged_at:ISODate("2026-02-04T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:5,notes:"Watery eyes",logged_at:ISODate("2026-02-04T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Cytopoint given — waiting for effect",logged_at:ISODate("2026-02-05T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Still licking paws",logged_at:ISODate("2026-02-05T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Cytopoint kicking in — much better",logged_at:ISODate("2026-02-06T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:3,notes:"Redness fading fast",logged_at:ISODate("2026-02-06T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Recovery faster this time",logged_at:ISODate("2026-02-07T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Paws healing",logged_at:ISODate("2026-02-08T00:00:00Z")},

  // Final days: back to baseline
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Back to normal",logged_at:ISODate("2026-02-08T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Skin clear and healthy",logged_at:ISODate("2026-02-09T16:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Doing great",logged_at:ISODate("2026-02-10T14:30:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Minimal symptoms",logged_at:ISODate("2026-02-11T15:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Comfortable and happy",logged_at:ISODate("2026-02-12T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:2,notes:"Eyes clear",logged_at:ISODate("2026-02-12T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Great day",logged_at:ISODate("2026-02-13T15:00:00Z")}
];

// Assign sequential _ids
sl.forEach((doc, i) => { doc._id = i + 1; });
db.symptom_logs.insertMany(sl);

// ── Treatment Logs ───────────────────────────────────────────
let tl = [
  // Daily Apoquel (16mg) — key dates across 60 days
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Morning dose with food",administered_at:ISODate("2025-12-15T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-16T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-17T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-18T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-19T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-20T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-21T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Increased to AM dose during flare",administered_at:ISODate("2025-12-22T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-23T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-24T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-25T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-26T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-27T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2025-12-28T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-01T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-04T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-08T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-13T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-14T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-15T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-16T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-17T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-18T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-19T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-20T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-01-25T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-02-01T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-02-02T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-02-03T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-02-04T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-02-05T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-02-08T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-02-12T13:00:00Z")},
  // Cytopoint — 2 monthly doses
  {pet_id:1,pet_name:"Finn",treatment_name:"Cytopoint Injection",treatment_type:"medication",dosage:"40mg injection",notes:"Monthly Cytopoint — administered at vet",administered_at:ISODate("2025-12-28T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Cytopoint Injection",treatment_type:"medication",dosage:"40mg injection",notes:"Monthly Cytopoint — good response last month",administered_at:ISODate("2026-02-05T20:00:00Z")},
  // Medicated Shampoo — weekly
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:"Weekly bath — 10 min contact time",administered_at:ISODate("2025-12-15T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2025-12-22T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:"Extra wash during flare week",administered_at:ISODate("2025-12-25T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2025-12-29T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2026-01-05T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2026-01-12T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:"Extra wash — second flare",administered_at:ISODate("2026-01-16T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2026-01-19T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2026-01-26T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2026-02-02T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:null,administered_at:ISODate("2026-02-09T23:00:00Z")},
  // Grain-Free Diet
  {pet_id:1,pet_name:"Finn",treatment_name:"Grain-Free Diet",treatment_type:"dietary",dosage:"2 cups daily",notes:"Started grain-free diet",administered_at:ISODate("2025-12-15T13:30:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Grain-Free Diet",treatment_type:"dietary",dosage:"2 cups daily",notes:"Tolerating diet well",administered_at:ISODate("2026-01-01T13:30:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Grain-Free Diet",treatment_type:"dietary",dosage:"2 cups daily",notes:"Continuing grain-free — no GI issues",administered_at:ISODate("2026-02-01T13:30:00Z")},
  // Hydrocortisone Cream — during flares
  {pet_id:1,pet_name:"Finn",treatment_name:"Hydrocortisone Cream",treatment_type:"topical",dosage:"Thin layer on affected area",notes:"Applied to hot spots on belly",administered_at:ISODate("2025-12-25T02:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Hydrocortisone Cream",treatment_type:"topical",dosage:"Thin layer on affected area",notes:"Applied to paw pads",administered_at:ISODate("2025-12-25T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Hydrocortisone Cream",treatment_type:"topical",dosage:"Thin layer on affected area",notes:"Hot spots on legs",administered_at:ISODate("2026-01-17T02:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Hydrocortisone Cream",treatment_type:"topical",dosage:"Thin layer on affected area",notes:"Paw pads during second flare",administered_at:ISODate("2026-01-17T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Hydrocortisone Cream",treatment_type:"topical",dosage:"Thin layer on affected area",notes:"Belly hot spots — third episode",administered_at:ISODate("2026-02-05T02:00:00Z")}
];
tl.forEach((doc, i) => { doc._id = i + 1; });
db.treatment_logs.insertMany(tl);

// ── Environmental Factor Logs ─────────────────────────────────
let ef = [
  // Week 1: Low pollen baseline
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.2,notes:"Low pollen day",logged_at:ISODate("2025-12-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:45.0,notes:null,logged_at:ISODate("2025-12-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:55.0,notes:null,logged_at:ISODate("2025-12-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.8,notes:null,logged_at:ISODate("2025-12-16T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:42.0,notes:null,logged_at:ISODate("2025-12-16T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.5,notes:null,logged_at:ISODate("2025-12-17T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:48.0,notes:null,logged_at:ISODate("2025-12-17T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.0,notes:null,logged_at:ISODate("2025-12-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:50.0,notes:null,logged_at:ISODate("2025-12-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:60.0,notes:null,logged_at:ISODate("2025-12-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:4.1,notes:"Pollen rising",logged_at:ISODate("2025-12-19T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:52.0,notes:null,logged_at:ISODate("2025-12-19T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.0,notes:null,logged_at:ISODate("2025-12-20T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:55.0,notes:null,logged_at:ISODate("2025-12-20T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.5,notes:"Pollen trending up",logged_at:ISODate("2025-12-21T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:54.0,notes:null,logged_at:ISODate("2025-12-21T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:65.0,notes:"Humid day",logged_at:ISODate("2025-12-21T12:00:00Z")},
  // Week 2: First pollen spike
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:8.2,notes:"HIGH pollen alert",logged_at:ISODate("2025-12-22T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:58.0,notes:null,logged_at:ISODate("2025-12-22T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:4.5,notes:null,logged_at:ISODate("2025-12-22T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.5,notes:"Very high pollen",logged_at:ISODate("2025-12-23T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:62.0,notes:null,logged_at:ISODate("2025-12-23T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:70.0,notes:null,logged_at:ISODate("2025-12-23T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:10.2,notes:"Peak pollen — extreme",logged_at:ISODate("2025-12-24T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:65.0,notes:null,logged_at:ISODate("2025-12-24T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:5.8,notes:"Mold also elevated",logged_at:ISODate("2025-12-24T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.8,notes:"Still very high",logged_at:ISODate("2025-12-25T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:63.0,notes:null,logged_at:ISODate("2025-12-25T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:7.5,notes:"Dropping slightly",logged_at:ISODate("2025-12-26T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:58.0,notes:null,logged_at:ISODate("2025-12-26T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:62.0,notes:null,logged_at:ISODate("2025-12-26T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.8,notes:"Continuing to drop",logged_at:ISODate("2025-12-27T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:52.0,notes:null,logged_at:ISODate("2025-12-27T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:4.2,notes:"Back toward normal",logged_at:ISODate("2025-12-28T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:48.0,notes:null,logged_at:ISODate("2025-12-28T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:3.0,notes:null,logged_at:ISODate("2025-12-28T12:00:00Z")},
  // Week 3-4: Low pollen recovery
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.0,notes:"Low pollen",logged_at:ISODate("2025-12-29T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:44.0,notes:null,logged_at:ISODate("2025-12-29T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.5,notes:null,logged_at:ISODate("2025-12-30T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:40.0,notes:null,logged_at:ISODate("2025-12-30T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.8,notes:null,logged_at:ISODate("2025-12-31T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:38.0,notes:"Cold day",logged_at:ISODate("2025-12-31T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:45.0,notes:"Dry winter air",logged_at:ISODate("2025-12-31T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.0,notes:null,logged_at:ISODate("2026-01-01T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:42.0,notes:null,logged_at:ISODate("2026-01-01T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.2,notes:null,logged_at:ISODate("2026-01-04T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:46.0,notes:null,logged_at:ISODate("2026-01-04T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.5,notes:null,logged_at:ISODate("2026-01-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:50.0,notes:null,logged_at:ISODate("2026-01-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:55.0,notes:null,logged_at:ISODate("2026-01-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:2.0,notes:null,logged_at:ISODate("2026-01-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:4.0,notes:"Pollen starting to rise again",logged_at:ISODate("2026-01-11T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:54.0,notes:null,logged_at:ISODate("2026-01-11T12:00:00Z")},
  // Week 5-6: Second pollen spike
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:6.5,notes:"Pollen climbing",logged_at:ISODate("2026-01-13T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:58.0,notes:null,logged_at:ISODate("2026-01-13T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:8.8,notes:"High pollen",logged_at:ISODate("2026-01-14T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:60.0,notes:null,logged_at:ISODate("2026-01-14T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:68.0,notes:null,logged_at:ISODate("2026-01-14T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.5,notes:"Very high — second spike",logged_at:ISODate("2026-01-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:64.0,notes:null,logged_at:ISODate("2026-01-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:5.5,notes:"Mold elevated too",logged_at:ISODate("2026-01-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:10.5,notes:"Peak pollen — worst of second spike",logged_at:ISODate("2026-01-16T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:66.0,notes:null,logged_at:ISODate("2026-01-16T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.0,notes:"Still high",logged_at:ISODate("2026-01-17T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:62.0,notes:null,logged_at:ISODate("2026-01-17T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:70.0,notes:"Muggy day",logged_at:ISODate("2026-01-17T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:7.0,notes:"Dropping",logged_at:ISODate("2026-01-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:58.0,notes:null,logged_at:ISODate("2026-01-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.5,notes:"Improving",logged_at:ISODate("2026-01-19T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:55.0,notes:null,logged_at:ISODate("2026-01-19T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:3.5,notes:null,logged_at:ISODate("2026-01-19T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:4.0,notes:"Near normal",logged_at:ISODate("2026-01-20T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:50.0,notes:null,logged_at:ISODate("2026-01-20T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.0,notes:"Normal",logged_at:ISODate("2026-01-21T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:48.0,notes:null,logged_at:ISODate("2026-01-21T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:52.0,notes:null,logged_at:ISODate("2026-01-21T12:00:00Z")},
  // Week 7: Stable
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.5,notes:null,logged_at:ISODate("2026-01-25T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:44.0,notes:null,logged_at:ISODate("2026-01-25T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.0,notes:null,logged_at:ISODate("2026-01-28T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:46.0,notes:null,logged_at:ISODate("2026-01-28T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:2.0,notes:null,logged_at:ISODate("2026-01-28T12:00:00Z")},
  // Week 8-9: Third spike
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.0,notes:"Pollen rising again",logged_at:ISODate("2026-02-01T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:52.0,notes:null,logged_at:ISODate("2026-02-01T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:8.0,notes:"High pollen",logged_at:ISODate("2026-02-02T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:58.0,notes:null,logged_at:ISODate("2026-02-02T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:65.0,notes:null,logged_at:ISODate("2026-02-02T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.8,notes:"Very high — third spike peak",logged_at:ISODate("2026-02-03T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:62.0,notes:null,logged_at:ISODate("2026-02-03T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:6.0,notes:"Mold spike too",logged_at:ISODate("2026-02-03T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.2,notes:"Still high",logged_at:ISODate("2026-02-04T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:60.0,notes:null,logged_at:ISODate("2026-02-04T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:7.0,notes:"Dropping after rain",logged_at:ISODate("2026-02-05T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:55.0,notes:null,logged_at:ISODate("2026-02-05T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:4.5,notes:"Post-rain drop",logged_at:ISODate("2026-02-06T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:50.0,notes:null,logged_at:ISODate("2026-02-06T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:58.0,notes:null,logged_at:ISODate("2026-02-06T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.0,notes:"Back to normal",logged_at:ISODate("2026-02-07T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:48.0,notes:null,logged_at:ISODate("2026-02-07T12:00:00Z")},
  // Final days
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.5,notes:null,logged_at:ISODate("2026-02-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:45.0,notes:null,logged_at:ISODate("2026-02-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.0,notes:null,logged_at:ISODate("2026-02-10T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:44.0,notes:null,logged_at:ISODate("2026-02-10T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:50.0,notes:null,logged_at:ISODate("2026-02-10T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:1.5,notes:"Low mold",logged_at:ISODate("2026-02-10T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.2,notes:null,logged_at:ISODate("2026-02-12T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:46.0,notes:null,logged_at:ISODate("2026-02-12T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:2.0,notes:"Beautiful low-pollen day",logged_at:ISODate("2026-02-13T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:50.0,notes:null,logged_at:ISODate("2026-02-13T12:00:00Z")}
];
ef.forEach((doc, i) => { doc._id = i + 1; });
db.env_factor_logs.insertMany(ef);

// Update counters to reflect loaded data
db.counters.updateOne({_id:"symptom_logs"},   {$set:{seq:sl.length}}, {upsert:true});
db.counters.updateOne({_id:"treatment_logs"}, {$set:{seq:tl.length}}, {upsert:true});
db.counters.updateOne({_id:"env_factor_logs"},{$set:{seq:ef.length}}, {upsert:true});

print("Seed complete: " + sl.length + " symptom logs, " + tl.length + " treatment logs, " + ef.length + " env factor logs.");
