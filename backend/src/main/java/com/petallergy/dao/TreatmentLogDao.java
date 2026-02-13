package com.petallergy.dao;

import com.petallergy.model.TreatmentLog;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class TreatmentLogDao {

    private final DataSource ds;

    public TreatmentLogDao(DataSource ds) {
        this.ds = ds;
    }

    public List<TreatmentLog> findByPetId(int petId) throws SQLException {
        String sql = "SELECT tl.treatment_log_id, tl.pet_id, tl.treatment_id, tl.dosage, " +
                     "tl.notes, tl.administered_at, t.name AS treatment_name, t.treatment_type " +
                     "FROM treatment_logs tl " +
                     "JOIN treatments t ON tl.treatment_id = t.treatment_id " +
                     "WHERE tl.pet_id = ? ORDER BY tl.administered_at DESC";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            try (ResultSet rs = ps.executeQuery()) {
                List<TreatmentLog> logs = new ArrayList<>();
                while (rs.next()) logs.add(mapRow(rs));
                return logs;
            }
        }
    }

    public List<TreatmentLog> findByPetIdAndDateRange(int petId, Instant from, Instant to) throws SQLException {
        String sql = "SELECT tl.treatment_log_id, tl.pet_id, tl.treatment_id, tl.dosage, " +
                     "tl.notes, tl.administered_at, t.name AS treatment_name, t.treatment_type " +
                     "FROM treatment_logs tl " +
                     "JOIN treatments t ON tl.treatment_id = t.treatment_id " +
                     "WHERE tl.pet_id = ? AND tl.administered_at >= ? AND tl.administered_at <= ? " +
                     "ORDER BY tl.administered_at DESC";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            ps.setTimestamp(2, Timestamp.from(from));
            ps.setTimestamp(3, Timestamp.from(to));
            try (ResultSet rs = ps.executeQuery()) {
                List<TreatmentLog> logs = new ArrayList<>();
                while (rs.next()) logs.add(mapRow(rs));
                return logs;
            }
        }
    }

    public TreatmentLog insert(TreatmentLog log) throws SQLException {
        String sql = "INSERT INTO treatment_logs (pet_id, treatment_id, dosage, notes, administered_at) " +
                     "VALUES (?, ?, ?, ?, ?) RETURNING treatment_log_id";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, log.getPetId());
            ps.setInt(2, log.getTreatmentId());
            ps.setString(3, log.getDosage());
            ps.setString(4, log.getNotes());
            ps.setTimestamp(5, log.getAdministeredAt() != null ? Timestamp.from(log.getAdministeredAt()) : new Timestamp(System.currentTimeMillis()));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) log.setTreatmentLogId(rs.getInt("treatment_log_id"));
            }
        }
        return log;
    }

    public boolean delete(int treatmentLogId) throws SQLException {
        String sql = "DELETE FROM treatment_logs WHERE treatment_log_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, treatmentLogId);
            return ps.executeUpdate() > 0;
        }
    }

    private TreatmentLog mapRow(ResultSet rs) throws SQLException {
        TreatmentLog tl = new TreatmentLog();
        tl.setTreatmentLogId(rs.getInt("treatment_log_id"));
        tl.setPetId(rs.getInt("pet_id"));
        tl.setTreatmentId(rs.getInt("treatment_id"));
        tl.setDosage(rs.getString("dosage"));
        tl.setNotes(rs.getString("notes"));
        tl.setAdministeredAt(rs.getTimestamp("administered_at").toInstant());
        tl.setTreatmentName(rs.getString("treatment_name"));
        tl.setTreatmentType(rs.getString("treatment_type"));
        return tl;
    }
}
