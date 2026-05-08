package com.petallergy;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mongodb.client.MongoDatabase;
import com.petallergy.config.DatabaseConfig;
import com.petallergy.controller.*;
import com.petallergy.dao.*;
import com.petallergy.service.OllamaService;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.json.JavalinJackson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class App {

    private static final Logger log = LoggerFactory.getLogger(App.class);

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

        // Controllers
        PetController petController             = new PetController(petDao);
        SymptomController symptomController     = new SymptomController(symptomLogDao, symptomTypeDao);
        TreatmentController treatmentController = new TreatmentController(treatmentLogDao, treatmentDao);
        EnvFactorController envFactorController = new EnvFactorController(envFactorLogDao, envFactorTypeDao);
        ChatController chatController           = new ChatController(ollamaService, llmQueryLogDao);

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
