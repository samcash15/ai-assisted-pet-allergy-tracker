package com.petallergy.dao;

import com.petallergy.model.User;

import javax.sql.DataSource;
import java.sql.*;

public class UserDao {

    private final DataSource ds;

    public UserDao(DataSource ds) {
        this.ds = ds;
    }

    public User findById(int userId) throws SQLException {
        String sql = "SELECT user_id, username, email, created_at FROM users WHERE user_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        }
    }

    private User mapRow(ResultSet rs) throws SQLException {
        User u = new User();
        u.setUserId(rs.getInt("user_id"));
        u.setUsername(rs.getString("username"));
        u.setEmail(rs.getString("email"));
        u.setCreatedAt(rs.getTimestamp("created_at").toInstant());
        return u;
    }
}
