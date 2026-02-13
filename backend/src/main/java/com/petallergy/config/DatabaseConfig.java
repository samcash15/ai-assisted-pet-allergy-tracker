package com.petallergy.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.stream.Collectors;

public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);
    private static HikariDataSource dataSource;

    public static DataSource getDataSource() {
        if (dataSource == null) {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(env("DB_URL", "jdbc:postgresql://localhost:5432/pet_allergy_tracker"));
            config.setUsername(env("DB_USER", "postgres"));
            config.setPassword(env("DB_PASSWORD", "postgres"));
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setConnectionTimeout(30000);
            config.setIdleTimeout(600000);
            config.setMaxLifetime(1800000);
            dataSource = new HikariDataSource(config);
            log.info("HikariCP DataSource initialized: {}", config.getJdbcUrl());
        }
        return dataSource;
    }

    public static void initSchema() {
        String sql = loadResource("/db/schema.sql");
        if (sql == null) {
            log.warn("schema.sql not found on classpath — skipping schema init");
            return;
        }
        try (Connection conn = getDataSource().getConnection();
             Statement stmt = conn.createStatement()) {
            // Execute each statement individually for reliable multi-statement execution
            for (String stmtSql : splitStatements(sql)) {
                if (!stmtSql.isBlank()) {
                    stmt.execute(stmtSql);
                }
            }
            log.info("Database schema initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize schema", e);
            throw new RuntimeException("Schema initialization failed", e);
        }
    }

    public static void seedData() {
        // Only seed if tables are empty (prevents duplicate data on restart)
        if (dataAlreadyExists()) {
            log.info("Seed data already exists — skipping");
            return;
        }

        String sql = loadResource("/db/seed.sql");
        if (sql == null) {
            log.info("seed.sql not found on classpath — skipping seed");
            return;
        }
        try (Connection conn = getDataSource().getConnection();
             Statement stmt = conn.createStatement()) {
            for (String stmtSql : splitStatements(sql)) {
                if (!stmtSql.isBlank()) {
                    stmt.execute(stmtSql);
                }
            }
            log.info("Seed data loaded successfully");
        } catch (Exception e) {
            log.warn("Seed data loading failed: {}", e.getMessage());
        }
    }

    private static boolean dataAlreadyExists() {
        try (Connection conn = getDataSource().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM symptom_logs")) {
            if (rs.next()) {
                int count = rs.getInt(1);
                log.info("Existing symptom_logs count: {}", count);
                return count > 0;
            }
        } catch (Exception e) {
            log.debug("Could not check existing data (table may not exist yet): {}", e.getMessage());
        }
        return false;
    }

    /**
     * Splits a SQL file into individual statements by semicolons,
     * respecting single-quoted strings (so semicolons inside strings aren't split on).
     */
    private static String[] splitStatements(String sql) {
        java.util.List<String> statements = new java.util.ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inString = false;

        for (int i = 0; i < sql.length(); i++) {
            char c = sql.charAt(i);

            if (c == '\'' && !inString) {
                inString = true;
                current.append(c);
            } else if (c == '\'' && inString) {
                // Handle escaped quotes ('')
                if (i + 1 < sql.length() && sql.charAt(i + 1) == '\'') {
                    current.append("''");
                    i++;
                } else {
                    inString = false;
                    current.append(c);
                }
            } else if (c == ';' && !inString) {
                String stmt = current.toString().trim();
                if (!stmt.isEmpty()) {
                    statements.add(stmt);
                }
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        // Add any remaining statement without trailing semicolon
        String last = current.toString().trim();
        if (!last.isEmpty()) {
            statements.add(last);
        }

        return statements.toArray(new String[0]);
    }

    public static void close() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            log.info("DataSource closed");
        }
    }

    private static String loadResource(String path) {
        InputStream is = DatabaseConfig.class.getResourceAsStream(path);
        if (is == null) return null;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            return reader.lines().collect(Collectors.joining("\n"));
        } catch (Exception e) {
            log.error("Failed to load resource: {}", path, e);
            return null;
        }
    }

    private static String env(String key, String defaultValue) {
        String value = System.getenv(key);
        return value != null ? value : defaultValue;
    }
}
