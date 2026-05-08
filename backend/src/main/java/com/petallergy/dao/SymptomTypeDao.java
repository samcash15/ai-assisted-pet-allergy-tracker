package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.petallergy.model.SymptomType;
import org.bson.Document;

import java.util.*;

public class SymptomTypeDao {

    private final MongoCollection<Document> collection;

    public SymptomTypeDao(MongoDatabase db) {
        this.collection = db.getCollection("symptom_types");
    }

    public List<SymptomType> findAll() {
        List<SymptomType> types = new ArrayList<>();
        collection.find().sort(Sorts.ascending("name")).forEach(doc -> types.add(mapDoc(doc)));
        return types;
    }

    public SymptomType findById(int id) {
        Document doc = collection.find(Filters.eq("_id", id)).first();
        return doc != null ? mapDoc(doc) : null;
    }

    private SymptomType mapDoc(Document doc) {
        SymptomType st = new SymptomType();
        st.setSymptomTypeId(doc.getInteger("_id"));
        st.setName(doc.getString("name"));
        st.setDescription(doc.getString("description"));
        return st;
    }
}
