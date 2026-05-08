package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.petallergy.model.EnvFactorType;
import org.bson.Document;

import java.util.*;

public class EnvFactorTypeDao {

    private final MongoCollection<Document> collection;

    public EnvFactorTypeDao(MongoDatabase db) {
        this.collection = db.getCollection("env_factor_types");
    }

    public List<EnvFactorType> findAll() {
        List<EnvFactorType> types = new ArrayList<>();
        collection.find().sort(Sorts.ascending("name")).forEach(doc -> types.add(mapDoc(doc)));
        return types;
    }

    public EnvFactorType findById(int id) {
        Document doc = collection.find(Filters.eq("_id", id)).first();
        return doc != null ? mapDoc(doc) : null;
    }

    private EnvFactorType mapDoc(Document doc) {
        EnvFactorType eft = new EnvFactorType();
        eft.setEnvFactorTypeId(doc.getInteger("_id"));
        eft.setName(doc.getString("name"));
        eft.setUnit(doc.getString("unit"));
        eft.setDescription(doc.getString("description"));
        return eft;
    }
}
