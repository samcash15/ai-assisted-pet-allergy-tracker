package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.petallergy.model.User;
import org.bson.Document;

public class UserDao {

    private final MongoCollection<Document> collection;

    public UserDao(MongoDatabase db) {
        this.collection = db.getCollection("users");
    }

    public User findById(int userId) {
        Document doc = collection.find(Filters.eq("_id", userId)).first();
        return doc != null ? mapDoc(doc) : null;
    }

    private User mapDoc(Document doc) {
        User u = new User();
        u.setUserId(doc.getInteger("_id"));
        u.setUsername(doc.getString("username"));
        u.setEmail(doc.getString("email"));
        u.setCreatedAt(doc.getDate("createdAt").toInstant());
        return u;
    }
}
