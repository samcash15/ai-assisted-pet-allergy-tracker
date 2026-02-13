package com.petallergy.model;

import java.time.Instant;

public class LlmQueryLog {
    private int queryLogId;
    private int userId;
    private String naturalLanguageQuery;
    private String generatedSql;
    private String responseSummary;
    private boolean success;
    private String errorMessage;
    private Instant createdAt;

    public LlmQueryLog() {}

    public int getQueryLogId() { return queryLogId; }
    public void setQueryLogId(int queryLogId) { this.queryLogId = queryLogId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getNaturalLanguageQuery() { return naturalLanguageQuery; }
    public void setNaturalLanguageQuery(String naturalLanguageQuery) { this.naturalLanguageQuery = naturalLanguageQuery; }

    public String getGeneratedSql() { return generatedSql; }
    public void setGeneratedSql(String generatedSql) { this.generatedSql = generatedSql; }

    public String getResponseSummary() { return responseSummary; }
    public void setResponseSummary(String responseSummary) { this.responseSummary = responseSummary; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
