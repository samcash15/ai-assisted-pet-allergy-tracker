package com.petallergy.controller;

import com.petallergy.dao.EnvFactorLogDao;
import com.petallergy.dao.EnvFactorTypeDao;
import com.petallergy.model.EnvFactorLog;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.time.Instant;
import java.util.Map;

public class EnvFactorController {

    private final EnvFactorLogDao envFactorLogDao;
    private final EnvFactorTypeDao envFactorTypeDao;

    public EnvFactorController(EnvFactorLogDao envFactorLogDao, EnvFactorTypeDao envFactorTypeDao) {
        this.envFactorLogDao = envFactorLogDao;
        this.envFactorTypeDao = envFactorTypeDao;
    }

    public void registerRoutes(Javalin app) {
        app.get("/api/env-factor-types", this::listEnvFactorTypes);
        app.get("/api/pets/{petId}/env-factors", this::listEnvFactors);
        app.post("/api/pets/{petId}/env-factors", this::createEnvFactor);
        app.delete("/api/env-factors/{envFactorLogId}", this::deleteEnvFactor);
    }

    private void listEnvFactorTypes(Context ctx) throws Exception {
        ctx.json(envFactorTypeDao.findAll());
    }

    private void listEnvFactors(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        String from = ctx.queryParam("from");
        String to = ctx.queryParam("to");

        if (from != null && to != null) {
            Instant fromInstant = Instant.parse(from);
            Instant toInstant = Instant.parse(to);
            ctx.json(envFactorLogDao.findByPetIdAndDateRange(petId, fromInstant, toInstant));
        } else {
            ctx.json(envFactorLogDao.findByPetId(petId));
        }
    }

    private void createEnvFactor(Context ctx) throws Exception {
        int petId = Integer.parseInt(ctx.pathParam("petId"));
        EnvFactorLog log = ctx.bodyAsClass(EnvFactorLog.class);
        log.setPetId(petId);

        if (log.getEnvFactorTypeId() == 0) {
            ctx.status(400).json(Map.of("error", "Environmental factor type is required"));
            return;
        }
        if (log.getValue() == null) {
            ctx.status(400).json(Map.of("error", "Value is required"));
            return;
        }

        EnvFactorLog created = envFactorLogDao.insert(log);
        ctx.status(201).json(created);
    }

    private void deleteEnvFactor(Context ctx) throws Exception {
        int logId = Integer.parseInt(ctx.pathParam("envFactorLogId"));
        boolean deleted = envFactorLogDao.delete(logId);
        if (!deleted) {
            ctx.status(404).json(Map.of("error", "Environmental factor log not found"));
            return;
        }
        ctx.status(204);
    }
}
