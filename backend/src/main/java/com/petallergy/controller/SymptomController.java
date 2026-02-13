package com.petallergy.controller;

import com.petallergy.dao.SymptomLogDao;
import com.petallergy.dao.SymptomTypeDao;
import com.petallergy.model.SymptomLog;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.time.Instant;
import java.util.Map;

public class SymptomController {

    private final SymptomLogDao symptomLogDao;
    private final SymptomTypeDao symptomTypeDao;

    public SymptomController(SymptomLogDao symptomLogDao, SymptomTypeDao symptomTypeDao) {
        this.symptomLogDao = symptomLogDao;
        this.symptomTypeDao = symptomTypeDao;
    }

    public void registerRoutes(Javalin app) {
        app.get("/api/symptom-types", this::listSymptomTypes);
        app.get("/api/pets/{petId}/symptoms", this::listSymptoms);
        app.post("/api/pets/{petId}/symptoms", this::createSymptom);
        app.delete("/api/symptoms/{symptomLogId}", this::deleteSymptom);
    }

    private void listSymptomTypes(Context ctx) throws Exception {
        ctx.json(symptomTypeDao.findAll());
    }

    private void listSymptoms(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        String from = ctx.queryParam("from");
        String to = ctx.queryParam("to");

        if (from != null && to != null) {
            Instant fromInstant = Instant.parse(from);
            Instant toInstant = Instant.parse(to);
            ctx.json(symptomLogDao.findByPetIdAndDateRange(petId, fromInstant, toInstant));
        } else {
            ctx.json(symptomLogDao.findByPetId(petId));
        }
    }

    private void createSymptom(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        SymptomLog log = ctx.bodyAsClass(SymptomLog.class);
        log.setPetId(petId);

        if (log.getSymptomTypeId() == 0) {
            ctx.status(400).json(Map.of("error", "Symptom type is required"));
            return;
        }
        if (log.getSeverity() < 1 || log.getSeverity() > 10) {
            ctx.status(400).json(Map.of("error", "Severity must be between 1 and 10"));
            return;
        }

        SymptomLog created = symptomLogDao.insert(log);
        ctx.status(201).json(created);
    }

    private void deleteSymptom(Context ctx) throws Exception {
        int logId = Integer.parseInt(ctx.pathParam("symptomLogId"));
        boolean deleted = symptomLogDao.delete(logId);
        if (!deleted) {
            ctx.status(404).json(Map.of("error", "Symptom log not found"));
            return;
        }
        ctx.status(204);
    }
}
