package com.petallergy.dao;

import com.petallergy.model.SymptomLog;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class SymptomLogDao {

    private final DataSource ds;

    public SymptomLogDao(DataSource ds) {
        this.ds = ds;
    }

    public List<SymptomLog> findByPetId(int petId) throws SQLException {
        String sql = "SELECT sl.symptom_log_id, sl.pet_id, sl.symptom_type_id, sl.severity, " +
                     "sl.notes, sl.logged_at, st.name AS symptom_type_name " +
                     "FROM symptom_logs sl " +
                     "JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id " +
                     "WHERE sl.pet_id = ? ORDER BY sl.logged_at DESC";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            try (ResultSet rs = ps.executeQuery()) {
                List<SymptomLog> logs = new ArrayList<>();
                while (rs.next()) logs.add(mapRow(rs));
                return logs;
            }
        }
    }

    public List<SymptomLog> findByPetIdAndDateRange(int petId, Instant from, Instant to) throws SQLException {
        String sql = "SELECT sl.symptom_log_id, sl.pet_id, sl.symptom_type_id, sl.severity, " +
                     "sl.notes, sl.logged_at, st.name AS symptom_type_name " +
                     "FROM symptom_logs sl " +
                     "JOIN symptom_types st ON sl.symptom_type_id = st.symptom_type_id " +
                     "WHERE sl.pet_id = ? AND sl.logged_at >= ? AND sl.logged_at <= ? " +
                     "ORDER BY sl.logged_at DESC";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            ps.setTimestamp(2, Timestamp.from(from));
            ps.setTimestamp(3, Timestamp.from(to));
            try (ResultSet rs = ps.executeQuery()) {
                List<SymptomLog> logs = new ArrayList<>();
                while (rs.next()) logs.add(mapRow(rs));
                return logs;
            }
        }
    }

    public SymptomLog insert(SymptomLog log) throws SQLException {
        String sql = "INSERT INTO symptom_logs (pet_id, symptom_type_id, severity, notes, logged_at) " +
                     "VALUES (?, ?, ?, ?, ?) RETURNING symptom_log_id";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, log.getPetId());
            ps.setInt(2, log.getSymptomTypeId());
            ps.setInt(3, log.getSeverity());
            ps.setString(4, log.getNotes());
            ps.setTimestamp(5, log.getLoggedAt() != null ? Timestamp.from(log.getLoggedAt()) : new Timestamp(System.currentTimeMillis()));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) log.setSymptomLogId(rs.getInt("symptom_log_id"));
            }
        }
        return log;
    }

    public boolean delete(int symptomLogId) throws SQLException {
        String sql = "DELETE FROM symptom_logs WHERE symptom_log_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, symptomLogId);
            return ps.executeUpdate() > 0;
        }
    }

    private SymptomLog mapRow(ResultSet rs) throws SQLException {
        SymptomLog sl = new SymptomLog();
        sl.setSymptomLogId(rs.getInt("symptom_log_id"));
        sl.setPetId(rs.getInt("pet_id"));
        sl.setSymptomTypeId(rs.getInt("symptom_type_id"));
        sl.setSeverity(rs.getInt("severity"));
        sl.setNotes(rs.getString("notes"));
        sl.setLoggedAt(rs.getTimestamp("logged_at").toInstant());
        sl.setSymptomTypeName(rs.getString("symptom_type_name"));
        return sl;
    }
}
