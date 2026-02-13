package com.petallergy.dao;

import com.petallergy.model.Pet;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PetDao {

    private final DataSource ds;

    public PetDao(DataSource ds) {
        this.ds = ds;
    }

    public List<Pet> findByUserId(int userId) throws SQLException {
        String sql = "SELECT pet_id, user_id, name, species, breed, date_of_birth, created_at " +
                     "FROM pets WHERE user_id = ? ORDER BY name";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                List<Pet> pets = new ArrayList<>();
                while (rs.next()) pets.add(mapRow(rs));
                return pets;
            }
        }
    }

    public Pet findById(int petId) throws SQLException {
        String sql = "SELECT pet_id, user_id, name, species, breed, date_of_birth, created_at " +
                     "FROM pets WHERE pet_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        }
    }

    public Pet insert(Pet pet) throws SQLException {
        String sql = "INSERT INTO pets (user_id, name, species, breed, date_of_birth) " +
                     "VALUES (?, ?, ?, ?, ?) RETURNING pet_id, created_at";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, pet.getUserId());
            ps.setString(2, pet.getName());
            ps.setString(3, pet.getSpecies());
            ps.setString(4, pet.getBreed());
            ps.setObject(5, pet.getDateOfBirth());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    pet.setPetId(rs.getInt("pet_id"));
                    pet.setCreatedAt(rs.getTimestamp("created_at").toInstant());
                }
            }
        }
        return pet;
    }

    public Pet update(Pet pet) throws SQLException {
        String sql = "UPDATE pets SET name = ?, species = ?, breed = ?, date_of_birth = ? " +
                     "WHERE pet_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pet.getName());
            ps.setString(2, pet.getSpecies());
            ps.setString(3, pet.getBreed());
            ps.setObject(4, pet.getDateOfBirth());
            ps.setInt(5, pet.getPetId());
            ps.executeUpdate();
        }
        return pet;
    }

    public boolean delete(int petId) throws SQLException {
        String sql = "DELETE FROM pets WHERE pet_id = ?";
        try (Connection conn = ds.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, petId);
            return ps.executeUpdate() > 0;
        }
    }

    private Pet mapRow(ResultSet rs) throws SQLException {
        Pet p = new Pet();
        p.setPetId(rs.getInt("pet_id"));
        p.setUserId(rs.getInt("user_id"));
        p.setName(rs.getString("name"));
        p.setSpecies(rs.getString("species"));
        p.setBreed(rs.getString("breed"));
        Date dob = rs.getDate("date_of_birth");
        if (dob != null) p.setDateOfBirth(dob.toLocalDate());
        p.setCreatedAt(rs.getTimestamp("created_at").toInstant());
        return p;
    }
}
