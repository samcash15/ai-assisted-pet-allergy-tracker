package com.petallergy.dao;

import com.petallergy.model.SymptomType;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SymptomTypeDao {

    private final DataSource ds;

    public SymptomTypeDao(DataSource ds) {
        this.ds = ds;
    }

    public List<SymptomType> findAll() throws SQLException {
        String sql = "SELECT symptom_type_id, name, description FROM symptom_types ORDER BY name";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            List<SymptomType> types = new ArrayList<>();
            while (rs.next()) types.add(mapRow(rs));
            return types;
        }
    }

    public SymptomType findById(int id) throws SQLException {
        String sql = "SELECT symptom_type_id, name, description FROM symptom_types WHERE symptom_type_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        }
    }

    private SymptomType mapRow(ResultSet rs) throws SQLException {
        SymptomType st = new SymptomType();
        st.setSymptomTypeId(rs.getInt("symptom_type_id"));
        st.setName(rs.getString("name"));
        st.setDescription(rs.getString("description"));
        return st;
    }
}
