// ============================================================
// Seed Data — May 2026 (peak spring allergy season for Finn)
// CS 5600 Advanced Database Systems — Spring 2026
// ============================================================
// Story: Spring allergy season is in full swing. Grass pollen
// peaks mid-May, driving two major flares:
//   Flare 1: May 10–14 — grass pollen peak (severity 7–9)
//   Flare 2: May 19–24 — mixed pollen + mold wave (severity 6–8)
// Cytopoint injections given May 5 and May 28.
// Apoquel administered daily throughout the month.
// ============================================================
// Run with: mongosh pet_allergy_tracker seed_may_2026.js
// NOTE: Run seed.js first to load reference data and the
//       baseline Dec 2025 – Feb 2026 history.
// ============================================================

if (db.symptom_logs.countDocuments({logged_at: {$gte: ISODate("2026-05-01T00:00:00Z"), $lte: ISODate("2026-05-31T23:59:59Z")}}) > 0) {
  print("May 2026 seed data already present — skipping.");
  quit();
}

// ── Ensure reference data (idempotent) ───────────────────────

db.users.updateOne({_id: 1},
  {$setOnInsert: {
    _id: 1, username: "sam", email: "sam@example.com",
    created_at: new Date(),
    pets: [{
      _id: 1, name: "Finn", species: "Dog", breed: "Golden Retriever",
      date_of_birth: ISODate("2021-03-15T00:00:00Z"),
      created_at: new Date()
    }]
  }},
  {upsert: true});

db.symptom_types.insertMany([
  {_id: 1, name: "Itching",           description: "Generalized scratching and itching behavior"},
  {_id: 2, name: "Skin Redness",      description: "Visible redness or inflammation on the skin"},
  {_id: 3, name: "Sneezing",          description: "Repeated sneezing episodes"},
  {_id: 4, name: "Ear Inflammation",  description: "Redness, swelling, or discharge inside the ears"},
  {_id: 5, name: "Paw Licking",       description: "Excessive licking or chewing of paws"},
  {_id: 6, name: "Watery Eyes",       description: "Excessive tearing or eye discharge"},
  {_id: 7, name: "Nasal Discharge",   description: "Runny nose or nasal drip"}
], {ordered: false});

db.treatments.insertMany([
  {_id: 1, name: "Apoquel",               treatment_type: "medication", description: "Oclacitinib — daily oral JAK inhibitor for allergic itch"},
  {_id: 2, name: "Cytopoint Injection",   treatment_type: "medication", description: "Lokivetmab — monthly injectable antibody targeting IL-31"},
  {_id: 3, name: "Medicated Shampoo",     treatment_type: "topical",    description: "Chlorhexidine/ketoconazole shampoo for skin infections"},
  {_id: 4, name: "Grain-Free Diet",       treatment_type: "dietary",    description: "Limited-ingredient grain-free kibble to reduce food allergens"},
  {_id: 5, name: "Hydrocortisone Cream",  treatment_type: "topical",    description: "OTC 1% hydrocortisone for localized hot spots"},
  {_id: 6, name: "Allergy Immunotherapy", treatment_type: "therapy",    description: "Subcutaneous allergy shots based on intradermal testing"}
], {ordered: false});

db.env_factor_types.insertMany([
  {_id: 1, name: "Pollen Count",     unit: "index", description: "Daily pollen index (0-12 scale)"},
  {_id: 2, name: "Temperature",      unit: "°F",    description: "Outdoor temperature in Fahrenheit"},
  {_id: 3, name: "Humidity",         unit: "%",     description: "Relative humidity percentage"},
  {_id: 4, name: "Mold Spore Count", unit: "index", description: "Daily mold spore index (0-12 scale)"}
], {ordered: false});

// ── Find max existing IDs so new docs don't collide ──────────

let slMax = db.symptom_logs.countDocuments()    > 0 ? db.symptom_logs.find({},{_id:1}).sort({_id:-1}).limit(1).next()._id    : 0;
let tlMax = db.treatment_logs.countDocuments()  > 0 ? db.treatment_logs.find({},{_id:1}).sort({_id:-1}).limit(1).next()._id  : 0;
let efMax = db.env_factor_logs.countDocuments() > 0 ? db.env_factor_logs.find({},{_id:1}).sort({_id:-1}).limit(1).next()._id : 0;

// ── Symptom Logs (71 entries) ─────────────────────────────────
// Flare 1: May 10–14 (grass pollen peaks 9.2–11.8)
// Flare 2: May 19–24 (pollen + mold double wave)
// Recovery after each Cytopoint dose (May 5, May 28)

let sl = [
  // May 1–4: Moderate spring start (pollen 5.8–7.0)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Mild scratching after morning walk — spring has arrived",logged_at:ISODate("2026-05-01T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Brief paw licking after backyard time",logged_at:ISODate("2026-05-01T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Scratching at neck and ears",logged_at:ISODate("2026-05-02T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Slight belly redness",logged_at:ISODate("2026-05-02T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"More scratching than yesterday — pollen rising",logged_at:ISODate("2026-05-03T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:3,notes:"Several sneezing fits during walk",logged_at:ISODate("2026-05-03T21:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Continued itching — trees and grass both blooming",logged_at:ISODate("2026-05-04T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:3,notes:"Watery eyes this afternoon",logged_at:ISODate("2026-05-04T22:00:00Z")},

  // May 5: Cytopoint injection day
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Pre-injection baseline — Cytopoint given at vet visit",logged_at:ISODate("2026-05-05T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:3,notes:"Paw licking after vet — a little stressed",logged_at:ISODate("2026-05-05T22:00:00Z")},

  // May 6–9: Brief improvement after Cytopoint
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Cytopoint working — much calmer",logged_at:ISODate("2026-05-06T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Good day overall",logged_at:ISODate("2026-05-07T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Skin looking clear",logged_at:ISODate("2026-05-07T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Minimal paw licking",logged_at:ISODate("2026-05-08T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Slight uptick — pollen climbing again",logged_at:ISODate("2026-05-09T19:00:00Z")},

  // May 10–14: FIRST FLARE — grass pollen peak (9.2–11.8)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Scratching picked up sharply — pollen very high today",logged_at:ISODate("2026-05-10T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:5,notes:"Belly and groin redness developing",logged_at:ISODate("2026-05-10T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Constant paw licking after walks",logged_at:ISODate("2026-05-10T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Intense scratching — could not settle",logged_at:ISODate("2026-05-11T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:5,notes:"Ears red and warm — shaking head",logged_at:ISODate("2026-05-11T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:5,notes:"Sneezing fits every hour outside",logged_at:ISODate("2026-05-11T21:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:6,notes:"Paw chewing — pads red and moist",logged_at:ISODate("2026-05-11T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:8,notes:"Worst day of the season so far — nonstop scratching",logged_at:ISODate("2026-05-12T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:7,notes:"Hot spots forming on inner thighs — used medicated shampoo",logged_at:ISODate("2026-05-12T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:7,notes:"Raw spots on paw pads",logged_at:ISODate("2026-05-12T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:6,notes:"Ear discharge starting",logged_at:ISODate("2026-05-13T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:9,notes:"Peak severity — applied hydrocortisone, Apoquel not enough",logged_at:ISODate("2026-05-13T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:6,notes:"Sneezing after any outdoor exposure",logged_at:ISODate("2026-05-13T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:8,notes:"Severe inflammation across belly and flanks",logged_at:ISODate("2026-05-13T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:8,notes:"Continuous paw chewing — sockettes applied overnight",logged_at:ISODate("2026-05-14T00:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Pollen starting to drop — slight improvement",logged_at:ISODate("2026-05-14T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:6,notes:"Hot spots still present but less angry",logged_at:ISODate("2026-05-14T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:5,notes:"Ears less irritated",logged_at:ISODate("2026-05-14T23:00:00Z")},

  // May 15–18: Recovery after first flare
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Continuing to improve",logged_at:ISODate("2026-05-15T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:5,notes:"Redness receding",logged_at:ISODate("2026-05-15T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Paw licking down from peak",logged_at:ISODate("2026-05-15T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:5,notes:"Better today — manageable",logged_at:ISODate("2026-05-16T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:4,notes:"Eyes watery but not as bad",logged_at:ISODate("2026-05-16T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Steady recovery",logged_at:ISODate("2026-05-17T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:4,notes:"Hot spots healing",logged_at:ISODate("2026-05-17T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Holding at moderate — pollen still elevated",logged_at:ISODate("2026-05-18T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:3,notes:"Paws healing well",logged_at:ISODate("2026-05-18T22:00:00Z")},

  // May 19–24: SECOND FLARE — mixed pollen + mold wave (pollen 8.0–10.5, mold 8.0)
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Scratching surging again — mold and pollen both high",logged_at:ISODate("2026-05-19T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:4,notes:"Sneezing started again this morning",logged_at:ISODate("2026-05-19T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:5,notes:"Back to paw licking — used medicated shampoo",logged_at:ISODate("2026-05-19T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Second wave hitting hard",logged_at:ISODate("2026-05-20T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:6,notes:"Inflammation back on belly and legs",logged_at:ISODate("2026-05-20T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:8,notes:"Mold + pollen combination really affecting Finn",logged_at:ISODate("2026-05-21T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:7,notes:"Paw chewing resumed — raw spots again",logged_at:ISODate("2026-05-21T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Ear Inflammation",severity:5,notes:"Ears flaring up again",logged_at:ISODate("2026-05-21T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:7,notes:"Still at peak of second wave",logged_at:ISODate("2026-05-22T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:6,notes:"Persistent skin inflammation",logged_at:ISODate("2026-05-22T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:6,notes:"Slowly improving — rain helped pollen drop",logged_at:ISODate("2026-05-23T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Sneezing",severity:5,notes:"Sneezing during outdoor time — used medicated shampoo",logged_at:ISODate("2026-05-23T19:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:4,notes:"Watery eyes in the afternoon",logged_at:ISODate("2026-05-23T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:5,notes:"Definite improvement — second flare subsiding",logged_at:ISODate("2026-05-24T18:00:00Z")},

  // May 25–27: Between flares, recovering
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:4,notes:"Continuing to recover",logged_at:ISODate("2026-05-25T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:3,notes:"Paw licking minimal again",logged_at:ISODate("2026-05-25T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Getting back to baseline",logged_at:ISODate("2026-05-26T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:3,notes:"Redness almost gone",logged_at:ISODate("2026-05-26T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Manageable scratching — Cytopoint due soon",logged_at:ISODate("2026-05-27T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Paws looking much better",logged_at:ISODate("2026-05-27T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:2,notes:"Eyes mostly clear",logged_at:ISODate("2026-05-27T23:30:00Z")},

  // May 28: Cytopoint injection day
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:3,notes:"Pre-injection — Cytopoint given at vet",logged_at:ISODate("2026-05-28T14:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:3,notes:"Some paw licking after the clinic visit",logged_at:ISODate("2026-05-28T22:00:00Z")},

  // May 29–31: Improving after second Cytopoint
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Cytopoint kicking in — very calm",logged_at:ISODate("2026-05-29T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Skin Redness",severity:2,notes:"Skin clearing beautifully",logged_at:ISODate("2026-05-29T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Great day — minimal symptoms",logged_at:ISODate("2026-05-30T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Paw Licking",severity:2,notes:"Paw licking gone",logged_at:ISODate("2026-05-30T22:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Itching",severity:2,notes:"Ending May on a great note",logged_at:ISODate("2026-05-31T18:00:00Z")},
  {pet_id:1,pet_name:"Finn",symptom_type:"Watery Eyes",severity:2,notes:"Eyes clear — happy boy",logged_at:ISODate("2026-05-31T22:00:00Z")}
];

sl.forEach((doc, i) => { doc._id = slMax + i + 1; });
db.symptom_logs.insertMany(sl);

// ── Treatment Logs (37 entries) ───────────────────────────────
// 31 daily Apoquel + 2 Cytopoint + 3 Medicated Shampoo + 1 Hydrocortisone Cream

let tl = [
  // Apoquel 16mg daily — May 1–31
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Morning dose with food",administered_at:ISODate("2026-05-01T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-02T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-03T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-04T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Gave with breakfast before vet appointment",administered_at:ISODate("2026-05-05T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-06T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-07T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-08T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-09T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Increased alertness for flare signs",administered_at:ISODate("2026-05-10T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-11T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Flare day — gave with extra water",administered_at:ISODate("2026-05-12T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Worst flare day — Apoquel + Cytopoint still not fully controlling",administered_at:ISODate("2026-05-13T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-14T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-15T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-16T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-17T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-18T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Second wave starting",administered_at:ISODate("2026-05-19T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-20T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-21T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-22T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-23T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-24T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-25T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-26T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-27T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:"Gave before vet visit for Cytopoint",administered_at:ISODate("2026-05-28T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-29T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-30T13:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Apoquel",treatment_type:"medication",dosage:"16mg tablet",notes:null,administered_at:ISODate("2026-05-31T13:00:00Z")},
  // Cytopoint Injection — May 5 and May 28
  {pet_id:1,pet_name:"Finn",treatment_name:"Cytopoint Injection",treatment_type:"medication",dosage:"40mg injection",notes:"Monthly Cytopoint — early May dose before pollen peak",administered_at:ISODate("2026-05-05T20:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Cytopoint Injection",treatment_type:"medication",dosage:"40mg injection",notes:"Monthly Cytopoint — post-second-flare dose",administered_at:ISODate("2026-05-28T20:00:00Z")},
  // Medicated Shampoo — during flare peaks
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:"Bath during first flare — 10 min contact time on hot spots",administered_at:ISODate("2026-05-12T23:00:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:"Bath at start of second flare",administered_at:ISODate("2026-05-19T23:30:00Z")},
  {pet_id:1,pet_name:"Finn",treatment_name:"Medicated Shampoo",treatment_type:"topical",dosage:"Full body wash",notes:"Mid-second-flare wash — skin calming down",administered_at:ISODate("2026-05-23T23:00:00Z")},
  // Hydrocortisone Cream — peak flare day
  {pet_id:1,pet_name:"Finn",treatment_name:"Hydrocortisone Cream",treatment_type:"topical",dosage:"Thin layer on affected area",notes:"Applied to hot spots on belly and inner thighs — worst flare day",administered_at:ISODate("2026-05-13T19:00:00Z")}
];

tl.forEach((doc, i) => { doc._id = tlMax + i + 1; });
db.treatment_logs.insertMany(tl);

// ── Environmental Factor Logs (72 entries) ────────────────────
// Pollen Count: daily (31 entries)
// Temperature: every other day, odd dates (16 entries)
// Humidity: every other day, even dates + May 31 (16 entries)
// Mold Spore Count: every 3–4 days (9 entries)

let ef = [
  // ── Pollen Count (31 entries — daily) ──
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.8,notes:"Moderate spring pollen",logged_at:ISODate("2026-05-01T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:6.2,notes:null,logged_at:ISODate("2026-05-02T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:6.5,notes:"Pollen trending up",logged_at:ISODate("2026-05-03T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:7.0,notes:null,logged_at:ISODate("2026-05-04T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:7.2,notes:"High — Cytopoint day",logged_at:ISODate("2026-05-05T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:6.8,notes:"Slight drop post-rain",logged_at:ISODate("2026-05-06T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:6.0,notes:null,logged_at:ISODate("2026-05-07T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:6.2,notes:null,logged_at:ISODate("2026-05-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:7.0,notes:"Rising again",logged_at:ISODate("2026-05-09T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.2,notes:"HIGH — grass pollen peak begins",logged_at:ISODate("2026-05-10T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:10.5,notes:"Very high pollen — first flare",logged_at:ISODate("2026-05-11T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:11.2,notes:"Extreme — near peak of season",logged_at:ISODate("2026-05-12T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:11.8,notes:"Season peak — worst day",logged_at:ISODate("2026-05-13T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:10.5,notes:"Dropping from peak",logged_at:ISODate("2026-05-14T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.0,notes:"Continuing to drop",logged_at:ISODate("2026-05-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:8.5,notes:"Still elevated",logged_at:ISODate("2026-05-16T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:8.0,notes:null,logged_at:ISODate("2026-05-17T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:8.2,notes:"Brief uptick before second wave",logged_at:ISODate("2026-05-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.5,notes:"HIGH — second wave starts",logged_at:ISODate("2026-05-19T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:10.2,notes:"Very high — mixed pollen and mold",logged_at:ISODate("2026-05-20T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:10.5,notes:"Second wave peak",logged_at:ISODate("2026-05-21T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.8,notes:"Still very high",logged_at:ISODate("2026-05-22T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:9.2,notes:"Rain helped — dropping",logged_at:ISODate("2026-05-23T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:8.0,notes:"Continued improvement",logged_at:ISODate("2026-05-24T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:7.0,notes:"Back toward normal range",logged_at:ISODate("2026-05-25T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:6.0,notes:null,logged_at:ISODate("2026-05-26T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.5,notes:"Cytopoint due tomorrow",logged_at:ISODate("2026-05-27T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:5.0,notes:"Cytopoint day — pollen still moderate",logged_at:ISODate("2026-05-28T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:4.2,notes:"Dropping as June approaches",logged_at:ISODate("2026-05-29T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:4.0,notes:null,logged_at:ISODate("2026-05-30T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Pollen Count",unit:"index",value:3.8,notes:"End of May — spring peak winding down",logged_at:ISODate("2026-05-31T12:00:00Z")},

  // ── Temperature (16 entries — odd dates) ──
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:65.0,notes:null,logged_at:ISODate("2026-05-01T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:67.0,notes:null,logged_at:ISODate("2026-05-03T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:69.0,notes:null,logged_at:ISODate("2026-05-05T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:70.0,notes:null,logged_at:ISODate("2026-05-07T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:72.0,notes:null,logged_at:ISODate("2026-05-09T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:75.0,notes:"Warm and sunny — pollen flying",logged_at:ISODate("2026-05-11T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:78.0,notes:"Hot day — peak flare",logged_at:ISODate("2026-05-13T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:76.0,notes:null,logged_at:ISODate("2026-05-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:74.0,notes:null,logged_at:ISODate("2026-05-17T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:77.0,notes:"Warm front — second wave",logged_at:ISODate("2026-05-19T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:80.0,notes:"Hottest day of month — mold and pollen peak",logged_at:ISODate("2026-05-21T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:79.0,notes:null,logged_at:ISODate("2026-05-23T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:75.0,notes:null,logged_at:ISODate("2026-05-25T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:73.0,notes:null,logged_at:ISODate("2026-05-27T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:71.0,notes:null,logged_at:ISODate("2026-05-29T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Temperature",unit:"°F",value:70.0,notes:"Comfortable end to May",logged_at:ISODate("2026-05-31T12:00:00Z")},

  // ── Humidity (16 entries — even dates + May 31) ──
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:60.0,notes:null,logged_at:ISODate("2026-05-02T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:62.0,notes:null,logged_at:ISODate("2026-05-04T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:58.0,notes:null,logged_at:ISODate("2026-05-06T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:60.0,notes:null,logged_at:ISODate("2026-05-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:68.0,notes:"Humid day — worsens allergy symptoms",logged_at:ISODate("2026-05-10T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:72.0,notes:"Peak humidity during first flare",logged_at:ISODate("2026-05-12T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:65.0,notes:null,logged_at:ISODate("2026-05-14T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:60.0,notes:null,logged_at:ISODate("2026-05-16T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:58.0,notes:null,logged_at:ISODate("2026-05-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:65.0,notes:"Muggy — second wave building",logged_at:ISODate("2026-05-20T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:68.0,notes:"High humidity with high mold",logged_at:ISODate("2026-05-22T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:62.0,notes:null,logged_at:ISODate("2026-05-24T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:57.0,notes:null,logged_at:ISODate("2026-05-26T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:58.0,notes:null,logged_at:ISODate("2026-05-28T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:55.0,notes:null,logged_at:ISODate("2026-05-30T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Humidity",unit:"%",value:54.0,notes:"Low humidity — comfortable end to May",logged_at:ISODate("2026-05-31T12:00:00Z")},

  // ── Mold Spore Count (9 entries) ──
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:4.5,notes:"Moderate mold baseline",logged_at:ISODate("2026-05-04T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:5.0,notes:"Rising slightly",logged_at:ISODate("2026-05-08T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:7.2,notes:"Elevated during first flare",logged_at:ISODate("2026-05-12T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:6.5,notes:null,logged_at:ISODate("2026-05-15T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:5.8,notes:null,logged_at:ISODate("2026-05-18T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:8.0,notes:"Mold peak — doubles impact of pollen during second flare",logged_at:ISODate("2026-05-21T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:6.2,notes:"Dropping after rain",logged_at:ISODate("2026-05-24T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:4.5,notes:null,logged_at:ISODate("2026-05-27T12:00:00Z")},
  {pet_id:1,pet_name:"Finn",factor_name:"Mold Spore Count",unit:"index",value:3.5,notes:"Low mold — good end to month",logged_at:ISODate("2026-05-30T12:00:00Z")}
];

ef.forEach((doc, i) => { doc._id = efMax + i + 1; });
db.env_factor_logs.insertMany(ef);

// Update counters
db.counters.updateOne({_id:"symptom_logs"},   {$set:{seq: slMax + sl.length}}, {upsert:true});
db.counters.updateOne({_id:"treatment_logs"}, {$set:{seq: tlMax + tl.length}}, {upsert:true});
db.counters.updateOne({_id:"env_factor_logs"},{$set:{seq: efMax + ef.length}}, {upsert:true});

print("May 2026 seed complete: " + sl.length + " symptom logs, " + tl.length + " treatment logs, " + ef.length + " env factor logs.");
