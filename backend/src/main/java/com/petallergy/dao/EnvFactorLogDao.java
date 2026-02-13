package com.petallergy.dao;

import com.petallergy.model.EnvFactorLog;

import javax.sql.DataSource;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class EnvFactorLogDao {

    private final DataSource ds;

    public EnvFactorLogDao(DataSource ds) {
        this.ds = ds;
    }

    public List<EnvFactorLog> findByPetId(int petId) throws SQLException {
        String sql = "SELECT efl.env_factor_log_id, efl.pet_id, efl.env_factor_type_id, efl.value, " +
                     "efl.notes, efl.logged_at, eft.name AS env_factor_type_name, eft.unit AS env_factor_type_unit " +
                     "FROM env_factor_logs efl " +
                     "JOIN env_factor_types eft ON efl.env_factor_type_id = eft.env_factor_type_id " +
                     "WHERE efl.pet_id = ? ORDER BY efl.logged_at DESC";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            try (ResultSet rs = ps.executeQuery()) {
                List<EnvFactorLog> logs = new ArrayList<>();
                while (rs.next()) logs.add(mapRow(rs));
                return logs;
            }
        }
    }

    public List<EnvFactorLog> findByPetIdAndDateRange(int petId, Instant from, Instant to) throws SQLException {
        String sql = "SELECT efl.env_factor_log_id, efl.pet_id, efl.env_factor_type_id, efl.value, " +
                     "efl.notes, efl.logged_at, eft.name AS env_factor_type_name, eft.unit AS env_factor_type_unit " +
                     "FROM env_factor_logs efl " +
                     "JOIN env_factor_types eft ON efl.env_factor_type_id = eft.env_factor_type_id " +
                     "WHERE efl.pet_id = ? AND efl.logged_at >= ? AND efl.logged_at <= ? " +
                     "ORDER BY efl.logged_at DESC";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            ps.setTimestamp(2, Timestamp.from(from));
            ps.setTimestamp(3, Timestamp.from(to));
            try (ResultSet rs = ps.executeQuery()) {
                List<EnvFactorLog> logs = new ArrayList<>();
                while (rs.next()) logs.add(mapRow(rs));
                return logs;
            }
        }
    }

    public EnvFactorLog insert(EnvFactorLog log) throws SQLException {
        String sql = "INSERT INTO env_factor_logs (pet_id, env_factor_type_id, value, notes, logged_at) " +
                     "VALUES (?, ?, ?, ?, ?) RETURNING env_factor_log_id";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, log.getPetId());
            ps.setInt(2, log.getEnvFactorTypeId());
            ps.setBigDecimal(3, log.getValue());
            ps.setString(4, log.getNotes());
            ps.setTimestamp(5, log.getLoggedAt() != null ? Timestamp.from(log.getLoggedAt()) : new Timestamp(System.currentTimeMillis()));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) log.setEnvFactorLogId(rs.getInt("env_factor_log_id"));
            }
        }
        return log;
    }

    public boolean delete(int envFactorLogId) throws SQLException {
        String sql = "DELETE FROM env_factor_logs WHERE env_factor_log_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, envFactorLogId);
            return ps.executeUpdate() > 0;
        }
    }

    private EnvFactorLog mapRow(ResultSet rs) throws SQLException {
        EnvFactorLog efl = new EnvFactorLog();
        efl.setEnvFactorLogId(rs.getInt("env_factor_log_id"));
        efl.setPetId(rs.getInt("pet_id"));
        efl.setEnvFactorTypeId(rs.getInt("env_factor_type_id"));
        efl.setValue(rs.getBigDecimal("value"));
        efl.setNotes(rs.getString("notes"));
        efl.setLoggedAt(rs.getTimestamp("logged_at").toInstant());
        efl.setEnvFactorTypeName(rs.getString("env_factor_type_name"));
        efl.setEnvFactorTypeUnit(rs.getString("env_factor_type_unit"));
        return efl;
    }
}
