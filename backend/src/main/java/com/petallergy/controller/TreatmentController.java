package com.petallergy.controller;

import com.petallergy.dao.TreatmentDao;
import com.petallergy.dao.TreatmentLogDao;
import com.petallergy.model.TreatmentLog;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.time.Instant;
import java.util.Map;

public class TreatmentController {

    private final TreatmentLogDao treatmentLogDao;
    private final TreatmentDao treatmentDao;

    public TreatmentController(TreatmentLogDao treatmentLogDao, TreatmentDao treatmentDao) {
        this.treatmentLogDao = treatmentLogDao;
        this.treatmentDao = treatmentDao;
    }

    public void registerRoutes(Javalin app) {
        app.get("/api/treatment-types", this::listTreatmentTypes);
        app.get("/api/pets/{petId}/treatments", this::listTreatments);
        app.post("/api/pets/{petId}/treatments", this::createTreatment);
        app.delete("/api/treatments/{treatmentLogId}", this::deleteTreatment);
    }

    private void listTreatmentTypes(Context ctx) throws Exception {
        ctx.json(treatmentDao.findAll());
    }

    private void listTreatments(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        String from = ctx.queryParam("from");
        String to = ctx.queryParam("to");

        if (from != null && to != null) {
            Instant fromInstant = Instant.parse(from);
            Instant toInstant = Instant.parse(to);
            ctx.json(treatmentLogDao.findByPetIdAndDateRange(petId, fromInstant, toInstant));
        } else {
            ctx.json(treatmentLogDao.findByPetId(petId));
        }
    }

    private void createTreatment(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        TreatmentLog log = ctx.bodyAsClass(TreatmentLog.class);
        log.setPetId(petId);

        if (log.getTreatmentId() == 0) {
            ctx.status(400).json(Map.of("error", "Treatment type is required"));
            return;
        }

        TreatmentLog created = treatmentLogDao.insert(log);
        ctx.status(201).json(created);
    }

    private void deleteTreatment(Context ctx) throws Exception {
        int logId = Integer.parseInt(ctx.pathParam("treatmentLogId"));
        boolean deleted = treatmentLogDao.delete(logId);
        if (!deleted) {
            ctx.status(404).json(Map.of("error", "Treatment log not found"));
            return;
        }
        ctx.status(204);
    }
}
