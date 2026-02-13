package com.petallergy.dao;

import com.petallergy.model.Treatment;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TreatmentDao {

    private final DataSource ds;

    public TreatmentDao(DataSource ds) {
        this.ds = ds;
    }

    public List<Treatment> findAll() throws SQLException {
        String sql = "SELECT treatment_id, name, treatment_type, description FROM treatments ORDER BY name";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            List<Treatment> treatments = new ArrayList<>();
            while (rs.next()) treatments.add(mapRow(rs));
            return treatments;
        }
    }

    public Treatment findById(int id) throws SQLException {
        String sql = "SELECT treatment_id, name, treatment_type, description FROM treatments WHERE treatment_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        }
    }

    private Treatment mapRow(ResultSet rs) throws SQLException {
        Treatment t = new Treatment();
        t.setTreatmentId(rs.getInt("treatment_id"));
        t.setName(rs.getString("name"));
        t.setTreatmentType(rs.getString("treatment_type"));
        t.setDescription(rs.getString("description"));
        return t;
    }
}
