package com.petallergy.dao;

import com.petallergy.model.LlmQueryLog;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class LlmQueryLogDao {

    private final DataSource ds;

    public LlmQueryLogDao(DataSource ds) {
        this.ds = ds;
    }

    public List<LlmQueryLog> findByUserId(int userId) throws SQLException {
        String sql = "SELECT query_log_id, user_id, natural_language_query, generated_sql, " +
                     "response_summary, success, error_message, created_at " +
                     "FROM llm_query_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                List<LlmQueryLog> logs = new ArrayList<>();
                while (rs.next()) logs.add(mapRow(rs));
                return logs;
            }
        }
    }

    public LlmQueryLog insert(LlmQueryLog log) throws SQLException {
        String sql = "INSERT INTO llm_query_logs (user_id, natural_language_query, generated_sql, " +
                     "response_summary, success, error_message) " +
                     "VALUES (?, ?, ?, ?, ?, ?) RETURNING query_log_id, created_at";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, log.getUserId());
            ps.setString(2, log.getNaturalLanguageQuery());
            ps.setString(3, log.getGeneratedSql());
            ps.setString(4, log.getResponseSummary());
            ps.setBoolean(5, log.isSuccess());
            ps.setString(6, log.getErrorMessage());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    log.setQueryLogId(rs.getInt("query_log_id"));
                    log.setCreatedAt(rs.getTimestamp("created_at").toInstant());
                }
            }
        }
        return log;
    }

    private LlmQueryLog mapRow(ResultSet rs) throws SQLException {
        LlmQueryLog log = new LlmQueryLog();
        log.setQueryLogId(rs.getInt("query_log_id"));
        log.setUserId(rs.getInt("user_id"));
        log.setNaturalLanguageQuery(rs.getString("natural_language_query"));
        log.setGeneratedSql(rs.getString("generated_sql"));
        log.setResponseSummary(rs.getString("response_summary"));
        log.setSuccess(rs.getBoolean("success"));
        log.setErrorMessage(rs.getString("error_message"));
        log.setCreatedAt(rs.getTimestamp("created_at").toInstant());
        return log;
    }
}
