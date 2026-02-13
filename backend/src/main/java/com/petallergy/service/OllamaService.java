package com.petallergy.service;

import com.petallergy.dao.LlmQueryLogDao;
import com.petallergy.model.LlmQueryLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.*;
import java.time.Duration;
import java.util.*;

public class OllamaService {

    private static final Logger log = LoggerFactory.getLogger(OllamaService.class);
    private static final String OLLAMA_URL = "http://localhost:11434/api/generate";
    private static final String MODEL = "llama3.2";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private final DataSource ds;
    private final LlmQueryLogDao llmQueryLogDao;
    private final HttpClient httpClient;

    private static final String SCHEMA_CONTEXT = """
        You are a PostgreSQL query generator. You ONLY output a single raw SELECT query. No explanations, no markdown, no comments, no semicolons.

        === DATABASE SCHEMA (exact CREATE TABLE definitions) ===

        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE pets (
            pet_id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_id),
            name VARCHAR(100) NOT NULL,
            species VARCHAR(50) NOT NULL,
            breed VARCHAR(100),
            date_of_birth DATE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE symptom_types (
            symptom_type_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT
        );

        CREATE TABLE symptom_logs (
            symptom_log_id SERIAL PRIMARY KEY,
            pet_id INTEGER NOT NULL REFERENCES pets(pet_id),
            symptom_type_id INTEGER NOT NULL REFERENCES symptom_types(symptom_type_id),
            severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 10),
            notes TEXT,
            logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE treatments (
            treatment_id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL UNIQUE,
            treatment_type VARCHAR(20) NOT NULL CHECK (treatment_type IN ('medication','topical','dietary','therapy')),
            description TEXT
        );

        CREATE TABLE treatment_logs (
            treatment_log_id SERIAL PRIMARY KEY,
            pet_id INTEGER NOT NULL REFERENCES pets(pet_id),
            treatment_id INTEGER NOT NULL REFERENCES treatments(treatment_id),
            dosage VARCHAR(100),
            notes TEXT,
            administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE env_factor_types (
            env_factor_type_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            unit VARCHAR(50),
            description TEXT
        );

        CREATE TABLE env_factor_logs (
            env_factor_log_id SERIAL PRIMARY KEY,
            pet_id INTEGER NOT NULL REFERENCES pets(pet_id),
            env_factor_type_id INTEGER NOT NULL REFERENCES env_factor_types(env_factor_type_id),
            value NUMERIC(10,2) NOT NULL,
            notes TEXT,
            logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        === COLUMN LOCATION REFERENCE (MEMORIZE THIS) ===

        pets table columns:       p.pet_id, p.user_id, p.name, p.species, p.breed, p.date_of_birth
        symptom_types columns:    st.symptom_type_id, st.name, st.description
        symptom_logs columns:     sl.symptom_log_id, sl.pet_id, sl.symptom_type_id, sl.severity, sl.notes, sl.logged_at
        treatments columns:       t.treatment_id, t.name, t.treatment_type, t.description
        treatment_logs columns:   tl.treatment_log_id, tl.pet_id, tl.treatment_id, tl.dosage, tl.notes, tl.administered_at
        env_factor_types columns: eft.env_factor_type_id, eft.name, eft.unit, eft.description
        env_factor_logs columns:  efl.env_factor_log_id, efl.pet_id, efl.env_factor_type_id, efl.value, efl.notes, efl.logged_at

        === COMMON MISTAKES TO AVOID ===

        WRONG: tl.treatment_name  → RIGHT: t.name (treatment name is on the treatments table, not treatment_logs)
        WRONG: sl.name            → RIGHT: st.name (symptom name is on symptom_types table, not symptom_logs)
        WRONG: efl.name           → RIGHT: eft.name (factor name is on env_factor_types table, not env_factor_logs)
        WRONG: tl.name            → RIGHT: t.name (treatment name is on the treatments table, not treatment_logs)
        WRONG: p.username         → RIGHT: p.name (the pet's name column is "name", not "username"; username is on users table)
        WRONG: sl.treatment_id    → RIGHT: treatment_id only exists on treatment_logs, NOT on symptom_logs
        WRONG: tl.symptom_type_id → RIGHT: symptom_type_id only exists on symptom_logs, NOT on treatment_logs
        WRONG: GROUP BY t.name when SELECT uses tl.treatment_name → all SELECT expressions must use the SAME alias.column as GROUP BY

        === CRITICAL JOIN RULES ===

        1. symptom_logs, treatment_logs, and env_factor_logs are THREE SEPARATE log tables.
           They NEVER directly join to each other. They ALL connect through pet_id.
        2. To correlate symptoms with treatments: JOIN both to the same pet_id, then compare dates.
        3. ALWAYS join type/reference tables to get human-readable names:
           - symptom_logs → JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id → use st.name
           - treatment_logs → JOIN treatments t ON tl.treatment_id = t.treatment_id → use t.name
           - env_factor_logs → JOIN env_factor_types eft ON efl.env_factor_type_id = eft.env_factor_type_id → use eft.name
        4. To filter by pet name: JOIN pets p ON <log>.pet_id = p.pet_id WHERE p.name ILIKE '%petname%'
        5. EVERY table alias in SELECT, WHERE, GROUP BY, ORDER BY MUST appear in FROM or JOIN.
        6. SELECT columns and GROUP BY columns must be consistent — use the SAME alias.column in both.

        === STANDARD ALIASES ===
        pets = p, symptom_logs = sl, symptom_types = st, treatment_logs = tl, treatments = t,
        env_factor_logs = efl, env_factor_types = eft, users = u

        === EXAMPLE QUERIES ===

        Q: What are the most common symptoms?
        SELECT st.name AS symptom_name, COUNT(*) AS occurrences, ROUND(AVG(sl.severity), 1) AS avg_severity
        FROM symptom_logs sl
        JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id
        GROUP BY st.name
        ORDER BY occurrences DESC
        LIMIT 50

        Q: Which treatments helped reduce itching?
        SELECT t.name AS treatment_name, ROUND(AVG(sl.severity), 1) AS avg_severity_after, COUNT(*) AS observations
        FROM treatment_logs tl
        JOIN treatments t ON tl.treatment_id = t.treatment_id
        JOIN symptom_logs sl ON sl.pet_id = tl.pet_id
            AND sl.logged_at BETWEEN tl.administered_at AND tl.administered_at + INTERVAL '3 days'
        JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id
        WHERE st.name ILIKE '%itching%'
        GROUP BY t.name
        ORDER BY avg_severity_after ASC
        LIMIT 50

        Q: Show average severity by month
        SELECT date_trunc('month', sl.logged_at) AS month, ROUND(AVG(sl.severity), 1) AS avg_severity, COUNT(*) AS total_logs
        FROM symptom_logs sl
        JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id
        GROUP BY month
        ORDER BY month
        LIMIT 50

        Q: Is there a correlation between pollen and symptoms?
        SELECT efl.logged_at::date AS date, efl.value AS pollen_index, ROUND(AVG(sl.severity), 1) AS avg_severity
        FROM env_factor_logs efl
        JOIN env_factor_types eft ON efl.env_factor_type_id = eft.env_factor_type_id
        JOIN symptom_logs sl ON sl.pet_id = efl.pet_id
            AND sl.logged_at::date = efl.logged_at::date
        WHERE eft.name ILIKE '%pollen%'
        GROUP BY efl.logged_at::date, efl.value
        ORDER BY date
        LIMIT 50

        Q: What treatments has Finn received?
        SELECT t.name AS treatment_name, t.treatment_type, COUNT(*) AS times_administered, MAX(tl.administered_at) AS last_administered
        FROM treatment_logs tl
        JOIN treatments t ON tl.treatment_id = t.treatment_id
        JOIN pets p ON tl.pet_id = p.pet_id
        WHERE p.name ILIKE '%finn%'
        GROUP BY t.name, t.treatment_type
        ORDER BY times_administered DESC
        LIMIT 50

        Q: How is Archie doing today?
        SELECT st.name AS symptom_name, sl.severity, sl.notes, sl.logged_at
        FROM symptom_logs sl
        JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id
        JOIN pets p ON sl.pet_id = p.pet_id
        WHERE p.name ILIKE '%archie%'
            AND sl.logged_at::date = CURRENT_DATE
        ORDER BY sl.logged_at DESC
        LIMIT 50

        Q: Show symptom severity trend over time for itching
        SELECT sl.logged_at::date AS date, sl.severity, sl.notes
        FROM symptom_logs sl
        JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id
        WHERE st.name ILIKE '%itching%'
        ORDER BY sl.logged_at
        LIMIT 50

        Q: When was pollen highest?
        SELECT efl.logged_at::date AS date, efl.value AS pollen_index, efl.notes
        FROM env_factor_logs efl
        JOIN env_factor_types eft ON efl.env_factor_type_id = eft.env_factor_type_id
        WHERE eft.name ILIKE '%pollen%'
        ORDER BY efl.value DESC
        LIMIT 50

        === OUTPUT RULES ===
        1. Output ONLY the raw SQL SELECT query.
        2. No markdown fences, no explanations, no comments, no semicolons.
        3. Use ILIKE for all name matching (case-insensitive).
        4. Always end with LIMIT 50.
        5. Use meaningful column aliases.
        6. NEVER use a column that does not exist on that table. Refer to COLUMN LOCATION REFERENCE above.
        """;

    private static final String SUMMARY_PROMPT_PREFIX = """
        You are a helpful veterinary health assistant. Given the following SQL query results about a pet's allergy data,
        provide a concise, friendly natural language summary. Focus on key insights and trends.
        Be specific with numbers and dates when available. Keep the response to 2-4 sentences.

        Query results:
        """;

    public OllamaService(DataSource ds, LlmQueryLogDao llmQueryLogDao) {
        this.ds = ds;
        this.llmQueryLogDao = llmQueryLogDao;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    private static final int MAX_RETRIES = 2;

    public Map<String, Object> processQuery(String naturalLanguageQuery, int userId) throws Exception {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("naturalLanguageQuery", naturalLanguageQuery);

        String generatedSql = null;
        String responseSummary = null;
        boolean success = false;
        String errorMessage = null;
        List<Map<String, Object>> results = null;

        try {
            // Step 1: Generate SQL from natural language
            generatedSql = generateSql(naturalLanguageQuery);
            log.info("Generated SQL (attempt 1): {}", generatedSql);

            // Step 2: Sanitize — must be SELECT only
            String sanitized = sanitizeSql(generatedSql);

            // Step 3: Execute with retry — if SQL fails, ask LLM to fix it
            Exception lastError = null;
            for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    results = executeReadOnlyQuery(sanitized);
                    lastError = null;
                    break;
                } catch (SQLException e) {
                    lastError = e;
                    if (attempt < MAX_RETRIES) {
                        log.warn("SQL failed (attempt {}), asking LLM to fix: {}", attempt + 1, e.getMessage());
                        generatedSql = fixSql(naturalLanguageQuery, sanitized, e.getMessage());
                        log.info("Fixed SQL (attempt {}): {}", attempt + 2, generatedSql);
                        sanitized = sanitizeSql(generatedSql);
                    }
                }
            }

            if (lastError != null) {
                throw lastError;
            }

            response.put("generatedSql", generatedSql);
            response.put("results", results);

            // Step 4: Summarize results
            responseSummary = summarizeResults(naturalLanguageQuery, results);
            response.put("responseSummary", responseSummary);

            success = true;

        } catch (SqlRejectionException e) {
            errorMessage = e.getMessage();
            response.put("generatedSql", generatedSql);
            response.put("error", errorMessage);
            log.warn("SQL rejected: {}", errorMessage);
        } catch (ConnectException e) {
            throw new OllamaUnavailableException("Ollama is not running");
        } catch (Exception e) {
            errorMessage = "Query execution failed: " + e.getMessage();
            response.put("generatedSql", generatedSql);
            response.put("error", errorMessage);
            log.error("Query processing failed", e);
        }

        // Step 5: Log query
        try {
            LlmQueryLog queryLog = new LlmQueryLog();
            queryLog.setUserId(userId);
            queryLog.setNaturalLanguageQuery(naturalLanguageQuery);
            queryLog.setGeneratedSql(generatedSql);
            queryLog.setResponseSummary(responseSummary);
            queryLog.setSuccess(success);
            queryLog.setErrorMessage(errorMessage);
            llmQueryLogDao.insert(queryLog);
        } catch (Exception e) {
            log.error("Failed to log query", e);
        }

        return response;
    }

    private String generateSql(String naturalLanguageQuery) throws Exception {
        String prompt = SCHEMA_CONTEXT + "\nUser question: " + naturalLanguageQuery;
        return callOllama(prompt).trim();
    }

    private String fixSql(String originalQuestion, String failedSql, String errorMessage) throws Exception {
        String prompt = SCHEMA_CONTEXT + "\n\n" +
            "The following SQL query was generated for the question: " + originalQuestion + "\n\n" +
            "FAILED SQL:\n" + failedSql + "\n\n" +
            "POSTGRESQL ERROR:\n" + errorMessage + "\n\n" +
            "Fix the SQL query to resolve this error. Remember these EXACT column locations:\n" +
            "- treatment name = t.name (on treatments table, NOT tl.treatment_name or tl.name)\n" +
            "- symptom name = st.name (on symptom_types table, NOT sl.name)\n" +
            "- env factor name = eft.name (on env_factor_types table, NOT efl.name)\n" +
            "- pet name = p.name (on pets table, NOT p.username)\n" +
            "- treatment_logs columns: tl.treatment_log_id, tl.pet_id, tl.treatment_id, tl.dosage, tl.notes, tl.administered_at\n" +
            "- symptom_logs columns: sl.symptom_log_id, sl.pet_id, sl.symptom_type_id, sl.severity, sl.notes, sl.logged_at\n" +
            "- SELECT columns and GROUP BY columns must use the SAME alias.column\n" +
            "- Every table alias in SELECT/WHERE/GROUP BY must have a matching FROM/JOIN\n" +
            "Output ONLY the corrected raw SQL query, nothing else.";
        return callOllama(prompt).trim();
    }

    private String summarizeResults(String originalQuery, List<Map<String, Object>> results) throws Exception {
        if (results == null || results.isEmpty()) {
            return "No results were found for your query.";
        }

        StringBuilder sb = new StringBuilder(SUMMARY_PROMPT_PREFIX);
        // Include up to 20 rows for summarization
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

        // Parse response — extract "response" field from JSON
        String body = httpResponse.body();
        return extractJsonField(body, "response");
    }

    String sanitizeSql(String sql) throws SqlRejectionException {
        if (sql == null || sql.isBlank()) {
            throw new SqlRejectionException("Generated SQL was empty");
        }

        // Strip markdown code fences if present
        String cleaned = sql.replaceAll("```sql\\s*", "").replaceAll("```\\s*", "").trim();

        // Remove trailing semicolons
        if (cleaned.endsWith(";")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1).trim();
        }

        // Must start with SELECT (case-insensitive)
        if (!cleaned.toUpperCase().startsWith("SELECT")) {
            throw new SqlRejectionException("Only SELECT queries are allowed. Got: " + cleaned.substring(0, Math.min(cleaned.length(), 50)));
        }

        // Reject dangerous keywords
        String upper = cleaned.toUpperCase();
        for (String keyword : List.of("INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE")) {
            // Check that these keywords aren't part of a SELECT (e.g. in a string literal or column alias)
            // Simple check: if the keyword appears outside a SELECT context as a statement start
            if (upper.matches(".*\\b" + keyword + "\\b.*") && !keyword.equals("CREATE")) {
                // Allow if it's in a subquery context or WHERE clause value, but not as statement start
                // For safety, reject if it appears to be a standalone statement
                String[] parts = cleaned.split(";");
                for (String part : parts) {
                    String trimmed = part.trim().toUpperCase();
                    if (trimmed.startsWith(keyword)) {
                        throw new SqlRejectionException("Dangerous SQL keyword detected: " + keyword);
                    }
                }
            }
        }

        return cleaned;
    }

    List<Map<String, Object>> executeReadOnlyQuery(String sql) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();
        try (Connection conn = ds.getConnection()) {
            conn.setReadOnly(true);
            try (Statement stmt = conn.createStatement()) {
                stmt.setQueryTimeout(5);
                try (ResultSet rs = stmt.executeQuery(sql)) {
                    ResultSetMetaData meta = rs.getMetaData();
                    int columnCount = meta.getColumnCount();
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        for (int i = 1; i <= columnCount; i++) {
                            String colName = meta.getColumnLabel(i);
                            Object value = rs.getObject(i);
                            row.put(colName, value != null ? value.toString() : null);
                        }
                        results.add(row);
                    }
                }
            } finally {
                conn.setReadOnly(false);
            }
        }
        return results;
    }

    private static String extractJsonField(String json, String field) {
        // Simple JSON field extraction without a library dependency
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
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default: sb.append(c);
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    public static class OllamaUnavailableException extends Exception {
        public OllamaUnavailableException(String message) { super(message); }
    }

    static class SqlRejectionException extends Exception {
        SqlRejectionException(String message) { super(message); }
    }
}
