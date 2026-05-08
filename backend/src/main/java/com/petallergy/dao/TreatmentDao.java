package com.petallergy.dao;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.petallergy.model.Treatment;
import org.bson.Document;

import java.util.*;

public class TreatmentDao {

    private final MongoCollection<Document> collection;

    public TreatmentDao(MongoDatabase db) {
        this.collection = db.getCollection("treatments");
    }

    public List<Treatment> findAll() {
        List<Treatment> treatments = new ArrayList<>();
        collection.find().sort(Sorts.ascending("name")).forEach(doc -> treatments.add(mapDoc(doc)));
        return treatments;
    }

    public Treatment findById(int id) {
        Document doc = collection.find(Filters.eq("_id", id)).first();
        return doc != null ? mapDoc(doc) : null;
    }

    private Treatment mapDoc(Document doc) {
        Treatment t = new Treatment();
        t.setTreatmentId(doc.getInteger("_id"));
        t.setName(doc.getString("name"));
        t.setTreatmentType(doc.getString("treatment_type"));
        t.setDescription(doc.getString("description"));
        return t;
    }
}
