package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.petallergy.config.DatabaseConfig;
import com.petallergy.model.LlmQueryLog;
import org.bson.Document;

import java.time.Instant;
import java.util.*;

public class LlmQueryLogDao {

    private final MongoCollection<Document> collection;

    public LlmQueryLogDao(MongoDatabase db) {
        this.collection = db.getCollection("llm_query_logs");
    }

    public List<LlmQueryLog> findByUserId(int userId) {
        List<LlmQueryLog> logs = new ArrayList<>();
        collection.find(Filters.eq("user_id", userId))
                  .sort(Sorts.descending("created_at"))
                  .limit(50)
                  .forEach(doc -> logs.add(mapDoc(doc)));
        return logs;
    }

    public LlmQueryLog insert(LlmQueryLog log) {
        int id = DatabaseConfig.getNextId("llm_query_logs");
        log.setQueryLogId(id);
        Instant now = Instant.now();
        log.setCreatedAt(now);

        Document doc = new Document("_id", id)
            .append("user_id", log.getUserId())
            .append("natural_language_query", log.getNaturalLanguageQuery())
            .append("generated_sql", log.getGeneratedSql())
            .append("response_summary", log.getResponseSummary())
            .append("success", log.isSuccess())
            .append("error_message", log.getErrorMessage())
            .append("created_at", Date.from(now));

        collection.insertOne(doc);
        return log;
    }

    private LlmQueryLog mapDoc(Document doc) {
        LlmQueryLog log = new LlmQueryLog();
        log.setQueryLogId(doc.getInteger("_id"));
        log.setUserId(doc.getInteger("user_id"));
        log.setNaturalLanguageQuery(doc.getString("natural_language_query"));
        log.setGeneratedSql(doc.getString("generated_sql"));
        log.setResponseSummary(doc.getString("response_summary"));
        Boolean success = doc.getBoolean("success");
        log.setSuccess(success != null && success);
        log.setErrorMessage(doc.getString("error_message"));
        log.setCreatedAt(doc.getDate("created_at").toInstant());
        return log;
    }
}
