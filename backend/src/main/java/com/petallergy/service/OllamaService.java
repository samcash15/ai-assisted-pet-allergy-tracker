package com.petallergy.service;

import com.mongodb.client.MongoDatabase;
import com.petallergy.dao.LlmQueryLogDao;
import com.petallergy.model.LlmQueryLog;
import org.bson.BsonArray;
import org.bson.BsonDocument;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

public class OllamaService {

    private static final Logger log = LoggerFactory.getLogger(OllamaService.class);
    private static final String OLLAMA_URL = "http://localhost:11434/api/generate";
    private static final String MODEL = "llama3.2";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);
    private static final int MAX_RETRIES = 2;

    private final MongoDatabase db;
    private final LlmQueryLogDao llmQueryLogDao;
    private final HttpClient httpClient;

    // Allowed collections the LLM may query
    private static final Set<String> ALLOWED_COLLECTIONS = Set.of(
        "symptom_logs", "treatment_logs", "env_factor_logs",
        "symptom_types", "env_factor_types",
        "treatments", "users", "llm_query_logs"
    );

    private static final String SCHEMA_CONTEXT = """
        You are a MongoDB aggregation pipeline generator for a pet allergy tracking application.
        Output ONLY a single JSON object with exactly two fields: "collection" and "pipeline".
        No markdown, no explanation, no extra text — just the raw JSON object.

        === COLLECTION SCHEMAS (all fields snake_case) ===

        "symptom_logs" — one document per observed symptom:
        {
          pet_id: int, pet_name: string,
          symptom_type: string,  // e.g. "Itching", "Skin Redness", "Sneezing", "Ear Inflammation", "Paw Licking", "Watery Eyes", "Nasal Discharge"
          severity: int (1–10), notes: string, logged_at: Date
        }

        "treatment_logs" — one document per treatment administration:
        {
          pet_id: int, pet_name: string,
          treatment_name: string,  // e.g. "Apoquel", "Cytopoint Injection", "Medicated Shampoo", "Grain-Free Diet", "Hydrocortisone Cream"
          treatment_type: string,  // "medication", "topical", "dietary", "therapy"
          dosage: string, notes: string, administered_at: Date
        }

        "env_factor_logs" — one document per environmental reading:
        {
          pet_id: int, pet_name: string,
          factor_name: string,  // e.g. "Pollen Count", "Temperature", "Humidity", "Mold Spore Count"
          unit: string,         // e.g. "index", "°F", "%"
          value: double, notes: string, logged_at: Date
        }

        "users":            { _id: int, username: string, email: string, created_at: Date,
                              pets: [{ _id: int, name: string, species: string, breed: string, date_of_birth: Date }] }
        "symptom_types":    { _id: int, name: string, description: string }
        "treatments":       { _id: int, name: string, treatment_type: string, description: string }
        "env_factor_types": { _id: int, name: string, unit: string, description: string }

        === AGGREGATION PATTERNS ===

        Filter by pet name (case-insensitive):
          { "$match": { "pet_name": { "$regex": "finn", "$options": "i" } } }

        Filter by date range (use $date with ISO-8601 string):
          { "$match": { "logged_at": { "$gte": { "$date": "2026-01-01T00:00:00Z" } } } }

        Group and count:
          { "$group": { "_id": "$symptom_type", "count": { "$sum": 1 }, "avgSeverity": { "$avg": "$severity" } } }

        Date bucketing by month:
          { "$group": { "_id": { "year": { "$year": "$logged_at" }, "month": { "$month": "$logged_at" } }, "avgSeverity": { "$avg": "$severity" }, "total": { "$sum": 1 } } }

        Format date as string:
          { "$project": { "date": { "$dateToString": { "format": "%Y-%m-%d", "date": "$logged_at" } }, "severity": 1 } }

        === EXAMPLE QUERIES ===

        Q: What are the most common symptoms?
        {"collection":"symptom_logs","pipeline":[{"$group":{"_id":"$symptom_type","count":{"$sum":1},"avgSeverity":{"$avg":"$severity"}}},{"$sort":{"count":-1}},{"$limit":50}]}

        Q: Show average severity by month
        {"collection":"symptom_logs","pipeline":[{"$group":{"_id":{"year":{"$year":"$logged_at"},"month":{"$month":"$logged_at"}},"avgSeverity":{"$avg":"$severity"},"totalLogs":{"$sum":1}}},{"$sort":{"_id.year":1,"_id.month":1}},{"$limit":50}]}

        Q: What treatments has Finn received?
        {"collection":"treatment_logs","pipeline":[{"$match":{"pet_name":{"$regex":"finn","$options":"i"}}},{"$group":{"_id":{"name":"$treatment_name","type":"$treatment_type"},"count":{"$sum":1},"last":{"$max":"$administered_at"}}},{"$sort":{"count":-1}},{"$limit":50}]}

        Q: Is there a correlation between pollen and symptoms?
        {"collection":"env_factor_logs","pipeline":[{"$match":{"factor_name":{"$regex":"pollen","$options":"i"}}},{"$project":{"date":{"$dateToString":{"format":"%Y-%m-%d","date":"$logged_at"}},"pollenIndex":"$value","notes":1}},{"$sort":{"pollenIndex":-1}},{"$limit":50}]}

        Q: How is Finn doing today?
        {"collection":"symptom_logs","pipeline":[{"$match":{"pet_name":{"$regex":"finn","$options":"i"},"logged_at":{"$gte":{"$date":"2026-05-05T00:00:00Z"},"$lte":{"$date":"2026-05-05T23:59:59Z"}}}},{"$project":{"symptom_type":1,"severity":1,"notes":1,"logged_at":1}},{"$sort":{"logged_at":-1}},{"$limit":50}]}

        Q: Show Finn's itching severity trend over time
        {"collection":"symptom_logs","pipeline":[{"$match":{"pet_name":{"$regex":"finn","$options":"i"},"symptom_type":{"$regex":"itching","$options":"i"}}},{"$project":{"date":{"$dateToString":{"format":"%Y-%m-%d","date":"$logged_at"}},"severity":1,"notes":1}},{"$sort":{"logged_at":1}},{"$limit":50}]}

        Q: When was pollen highest?
        {"collection":"env_factor_logs","pipeline":[{"$match":{"factor_name":{"$regex":"pollen","$options":"i"}}},{"$project":{"date":{"$dateToString":{"format":"%Y-%m-%d","date":"$logged_at"}},"pollenIndex":"$value","notes":1}},{"$sort":{"pollenIndex":-1}},{"$limit":50}]}

        Q: Which treatments were used during high-severity weeks?
        {"collection":"treatment_logs","pipeline":[{"$group":{"_id":"$treatment_name","count":{"$sum":1},"lastUsed":{"$max":"$administered_at"}}},{"$sort":{"count":-1}},{"$limit":50}]}

        === OUTPUT RULES ===
        1. Output ONLY the raw JSON object — no markdown, no explanation, nothing else.
        2. "collection" must be one of: symptom_logs, treatment_logs, env_factor_logs, symptom_types, treatments, env_factor_types, users, llm_query_logs
        3. "pipeline" must be a valid MongoDB aggregation array.
        4. Always use "$regex" with "$options": "i" for case-insensitive name matching.
        5. NEVER use "$out" or "$merge" (write operations are forbidden).
        6. Always end the pipeline with {"$limit": 50}.
        7. Field names are snake_case: pet_name, symptom_type, logged_at, administered_at, treatment_name, factor_name, etc.
        """;

    private static final String SUMMARY_PROMPT_PREFIX = """
        You are a helpful veterinary health assistant. Given the following MongoDB query results about a pet's allergy data,
        provide a concise, friendly natural language summary. Focus on key insights and trends.
        Be specific with numbers and dates when available. Keep the response to 2-4 sentences.

        Query results:
        """;

    public OllamaService(MongoDatabase db, LlmQueryLogDao llmQueryLogDao) {
        this.db = db;
        this.llmQueryLogDao = llmQueryLogDao;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Map<String, Object> processQuery(String naturalLanguageQuery, int userId) throws Exception {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("naturalLanguageQuery", naturalLanguageQuery);

        String generatedQuery = null;
        String responseSummary = null;
        boolean success = false;
        String errorMessage = null;
        List<Map<String, Object>> results = null;

        try {
            // Step 1: Generate MongoDB aggregation pipeline
            generatedQuery = generateQuery(naturalLanguageQuery);
            log.info("Generated query (attempt 1): {}", generatedQuery);

            // Step 2: Validate — must target an allowed collection, no write stages
            String validated = validateQuery(generatedQuery);

            // Step 3: Execute with retry — if query fails, ask LLM to fix it
            Exception lastError = null;
            for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    results = executeAggregation(validated);
                    lastError = null;
                    break;
                } catch (Exception e) {
                    lastError = e;
                    if (attempt < MAX_RETRIES) {
                        log.warn("Query failed (attempt {}), asking LLM to fix: {}", attempt + 1, e.getMessage());
                        generatedQuery = fixQuery(naturalLanguageQuery, validated, e.getMessage());
                        log.info("Fixed query (attempt {}): {}", attempt + 2, generatedQuery);
                        validated = validateQuery(generatedQuery);
                    }
                }
            }

            if (lastError != null) throw lastError;

            response.put("generatedSql", generatedQuery);
            response.put("results", results);

            // Step 4: Summarize results
            responseSummary = summarizeResults(naturalLanguageQuery, results);
            response.put("responseSummary", responseSummary);
            success = true;

        } catch (QueryRejectionException e) {
            errorMessage = e.getMessage();
            response.put("generatedSql", generatedQuery);
            response.put("error", errorMessage);
            log.warn("Query rejected: {}", errorMessage);
        } catch (ConnectException e) {
            throw new OllamaUnavailableException("Ollama is not running");
        } catch (Exception e) {
            errorMessage = "Query execution failed: " + e.getMessage();
            response.put("generatedSql", generatedQuery);
            response.put("error", errorMessage);
            log.error("Query processing failed", e);
        }

        // Step 5: Audit log
        try {
            LlmQueryLog queryLog = new LlmQueryLog();
            queryLog.setUserId(userId);
            queryLog.setNaturalLanguageQuery(naturalLanguageQuery);
            queryLog.setGeneratedSql(generatedQuery);
            queryLog.setResponseSummary(responseSummary);
            queryLog.setSuccess(success);
            queryLog.setErrorMessage(errorMessage);
            llmQueryLogDao.insert(queryLog);
        } catch (Exception e) {
            log.error("Failed to log query", e);
        }

        return response;
    }

    private String generateQuery(String naturalLanguageQuery) throws Exception {
        String prompt = SCHEMA_CONTEXT + "\nUser question: " + naturalLanguageQuery;
        return callOllama(prompt).trim();
    }

    private String fixQuery(String originalQuestion, String failedQuery, String errorMessage) throws Exception {
        String prompt = SCHEMA_CONTEXT + "\n\n" +
            "The following MongoDB aggregation was generated for: " + originalQuestion + "\n\n" +
            "FAILED QUERY:\n" + failedQuery + "\n\n" +
            "ERROR:\n" + errorMessage + "\n\n" +
            "Fix the aggregation pipeline to resolve this error. Remember:\n" +
            "- All field names are snake_case: pet_name, symptom_type, logged_at, administered_at, treatment_name, factor_name\n" +
            "- Use $regex with $options 'i' for case-insensitive matching\n" +
            "- Date comparisons use {$gte: {$date: 'ISO-string'}}\n" +
            "- NEVER use $out or $merge\n" +
            "- End pipeline with {$limit: 50}\n" +
            "Output ONLY the corrected JSON object, nothing else.";
        return callOllama(prompt).trim();
    }

    private String summarizeResults(String originalQuery, List<Map<String, Object>> results) throws Exception {
        if (results == null || results.isEmpty()) {
            return "No results were found for your query.";
        }
        StringBuilder sb = new StringBuilder(SUMMARY_PROMPT_PREFIX);
        int limit = Math.min(results.size(), 20);
        for (int i = 0; i < limit; i++) {
            sb.append(results.get(i).toString()).append("\n");
        }
        if (results.size() > 20) {
            sb.append("... and ").append(results.size() - 20).append(" more rows\n");
        }
        sb.append("\nOriginal question: ").append(originalQuery);
        return callOllama(sb.toString()).trim();
    }

    // Visible for testing
    String validateQuery(String queryJson) throws QueryRejectionException {
        if (queryJson == null || queryJson.isBlank()) {
            throw new QueryRejectionException("Generated query was empty");
        }

        // Strip markdown code fences if present
        String cleaned = queryJson.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        if (cleaned.isBlank()) {
            throw new QueryRejectionException("Generated query was empty after stripping markdown");
        }

        // Parse using BsonDocument for strict extended-JSON validation
        BsonDocument parsed;
        try {
            parsed = BsonDocument.parse(cleaned);
        } catch (Exception e) {
            throw new QueryRejectionException("Invalid JSON: " + e.getMessage());
        }

        // Validate collection name
        if (!parsed.containsKey("collection")) {
            throw new QueryRejectionException("Missing 'collection' field");
        }
        String collectionName = parsed.getString("collection").getValue();
        if (!ALLOWED_COLLECTIONS.contains(collectionName)) {
            throw new QueryRejectionException("Unknown collection: " + collectionName);
        }

        // Validate pipeline
        if (!parsed.containsKey("pipeline") || !parsed.get("pipeline").isArray()) {
            throw new QueryRejectionException("Missing or invalid 'pipeline' array");
        }

        // Block write stages
        BsonArray pipeline = parsed.getArray("pipeline");
        for (var stage : pipeline) {
            if (stage.isDocument()) {
                BsonDocument stageDoc = stage.asDocument();
                if (stageDoc.containsKey("$out") || stageDoc.containsKey("$merge")) {
                    throw new QueryRejectionException("Write stage ($out / $merge) is not permitted");
                }
            }
        }

        return cleaned;
    }

    // Visible for testing
    List<Map<String, Object>> executeAggregation(String queryJson) throws Exception {
        BsonDocument parsed = BsonDocument.parse(queryJson);
        String collectionName = parsed.getString("collection").getValue();
        BsonArray pipelineArray = parsed.getArray("pipeline");

        List<BsonDocument> pipeline = new ArrayList<>();
        for (var stage : pipelineArray) {
            pipeline.add(stage.asDocument());
        }

        List<Map<String, Object>> results = new ArrayList<>();
        db.getCollection(collectionName).aggregate(pipeline)
          .forEach(doc -> results.add(docToMap(doc)));
        return results;
    }

    private Map<String, Object> docToMap(Document doc) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : doc.entrySet()) {
            String key = "_id".equals(entry.getKey()) ? "id" : entry.getKey();
            Object val = entry.getValue();
            if (val instanceof Date) {
                map.put(key, ((Date) val).toInstant().toString());
            } else if (val instanceof Document) {
                map.put(key, docToMap((Document) val));
            } else {
                map.put(key, val != null ? val.toString() : null);
            }
        }
        return map;
    }

    private String callOllama(String prompt) throws Exception {
        String requestBody = String.format(
            "{\"model\":\"%s\",\"prompt\":%s,\"stream\":false}",
            MODEL, escapeJson(prompt)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OLLAMA_URL))
                .header("Content-Type", "application/json")
                .timeout(TIMEOUT)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> httpResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (httpResponse.statusCode() != 200) {
            throw new RuntimeException("Ollama returned status " + httpResponse.statusCode());
        }

        return extractJsonField(httpResponse.body(), "response");
    }

    private static String extractJsonField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key);
        if (start == -1) {
            key = "\"" + field + "\": \"";
            start = json.indexOf(key);
        }
        if (start == -1) return "";

        start += key.length();
        StringBuilder sb = new StringBuilder();
        boolean escaped = false;
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escaped) {
                switch (c) {
                    case 'n': sb.append('\n'); break;
                    case 't': sb.append('\t'); break;
                    case '"': sb.append('"'); break;
                    case '\\': sb.append('\\'); break;
                    default: sb.append(c);
                }
                escaped = false;
            } else if (c == '\\') {
                escaped = true;
            } else if (c == '"') {
                break;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private static String escapeJson(String text) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : text.toCharArray()) {
            switch (c) {
                case '"':  sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n");  break;
                case '\r': sb.append("\\r");  break;
                case '\t': sb.append("\\t");  break;
                default:   sb.append(c);
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    public static class OllamaUnavailableException extends Exception {
        public OllamaUnavailableException(String message) { super(message); }
    }

    static class QueryRejectionException extends Exception {
        QueryRejectionException(String message) { super(message); }
    }
}
