package com.petallergy.controller;

import com.petallergy.dao.LlmQueryLogDao;
import com.petallergy.service.OllamaService;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.util.Map;

public class ChatController {

    private static final int DEFAULT_USER_ID = 1;
    private final OllamaService ollamaService;
    private final LlmQueryLogDao llmQueryLogDao;

    public ChatController(OllamaService ollamaService, LlmQueryLogDao llmQueryLogDao) {
        this.ollamaService = ollamaService;
        this.llmQueryLogDao = llmQueryLogDao;
    }

    public void registerRoutes(Javalin app) {
        app.post("/api/chat", this::chat);
        app.get("/api/chat/history", this::chatHistory);
    }

    private void chat(Context ctx) throws Exception {
        Map<?, ?> body = ctx.bodyAsClass(Map.class);
        String query = (String) body.get("query");

        if (query == null || query.isBlank()) {
            ctx.status(400).json(Map.of("error", "Query is required"));
            return;
        }

        try {
            Map<String, Object> response = ollamaService.processQuery(query, DEFAULT_USER_ID);
            ctx.json(response);
        } catch (OllamaService.OllamaUnavailableException e) {
            ctx.status(503).json(Map.of(
                "error", "LLM service is unavailable. Make sure Ollama is running on localhost:11434.",
                "naturalLanguageQuery", query
            ));
        }
    }

    private void chatHistory(Context ctx) throws Exception {
        ctx.json(llmQueryLogDao.findByUserId(DEFAULT_USER_ID));
    }
}
