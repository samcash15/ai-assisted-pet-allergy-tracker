package com.petallergy.dao;

import com.petallergy.model.EnvFactorType;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EnvFactorTypeDao {

    private final DataSource ds;

    public EnvFactorTypeDao(DataSource ds) {
        this.ds = ds;
    }

    public List<EnvFactorType> findAll() throws SQLException {
        String sql = "SELECT env_factor_type_id, name, unit, description FROM env_factor_types ORDER BY name";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            List<EnvFactorType> types = new ArrayList<>();
            while (rs.next()) types.add(mapRow(rs));
            return types;
        }
    }

    public EnvFactorType findById(int id) throws SQLException {
        String sql = "SELECT env_factor_type_id, name, unit, description FROM env_factor_types WHERE env_factor_type_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        }
    }

    private EnvFactorType mapRow(ResultSet rs) throws SQLException {
        EnvFactorType eft = new EnvFactorType();
        eft.setEnvFactorTypeId(rs.getInt("env_factor_type_id"));
        eft.setName(rs.getString("name"));
        eft.setUnit(rs.getString("unit"));
        eft.setDescription(rs.getString("description"));
        return eft;
    }
}
