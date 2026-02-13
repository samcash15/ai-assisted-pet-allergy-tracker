package com.petallergy;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.petallergy.config.DatabaseConfig;
import com.petallergy.controller.*;
import com.petallergy.dao.*;
import com.petallergy.service.OllamaService;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.json.JavalinJackson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.SQLException;

public class App {

    private static final Logger log = LoggerFactory.getLogger(App.class);

    public static void main(String[] args) {
        DataSource ds = DatabaseConfig.getDataSource();
        DatabaseConfig.initSchema();
        DatabaseConfig.seedData();

        // DAOs
        PetDao petDao = new PetDao(ds);
        SymptomTypeDao symptomTypeDao = new SymptomTypeDao(ds);
        SymptomLogDao symptomLogDao = new SymptomLogDao(ds);
        TreatmentDao treatmentDao = new TreatmentDao(ds);
        TreatmentLogDao treatmentLogDao = new TreatmentLogDao(ds);
        EnvFactorTypeDao envFactorTypeDao = new EnvFactorTypeDao(ds);
        EnvFactorLogDao envFactorLogDao = new EnvFactorLogDao(ds);
        LlmQueryLogDao llmQueryLogDao = new LlmQueryLogDao(ds);

        // Services
        OllamaService ollamaService = new OllamaService(ds, llmQueryLogDao);

        // Controllers
        PetController petController = new PetController(petDao);
        SymptomController symptomController = new SymptomController(symptomLogDao, symptomTypeDao);
        TreatmentController treatmentController = new TreatmentController(treatmentLogDao, treatmentDao);
        EnvFactorController envFactorController = new EnvFactorController(envFactorLogDao, envFactorTypeDao);
        ChatController chatController = new ChatController(ollamaService, llmQueryLogDao);

        Javalin app = Javalin.create(config -> {
            config.staticFiles.add("/public", Location.CLASSPATH);
            config.http.defaultContentType = "application/json";
            config.jsonMapper(new JavalinJackson().updateMapper(mapper -> {
                mapper.registerModule(new JavaTimeModule());
                mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            }));
        });

        // Register routes
        petController.registerRoutes(app);
        symptomController.registerRoutes(app);
        treatmentController.registerRoutes(app);
        envFactorController.registerRoutes(app);
        chatController.registerRoutes(app);

        // Global exception handler
        app.exception(SQLException.class, (e, ctx) -> {
            log.error("Database error", e);
            ctx.status(500).json(java.util.Map.of("error", "Database error: " + e.getMessage()));
        });

        app.exception(Exception.class, (e, ctx) -> {
            log.error("Unexpected error", e);
            ctx.status(500).json(java.util.Map.of("error", "Internal server error: " + e.getMessage()));
        });

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            app.stop();
            DatabaseConfig.close();
        }));

        app.start(7070);
        log.info("Pet Allergy Tracker running at http://localhost:7070");
    }
}
