const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../mongo-connection');

const router = express.Router();

// GET /data - Get all data
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const data = await db.collection('example').find({}).toArray();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /data/:id - Get data by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const item = await db.collection('example').findOne({ _id: new ObjectId(req.params.id) });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Data not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /data - Add new data
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const newData = { ...req.body, createdAt: new Date() };
    const result = await db.collection('example').insertOne(newData);
    res.status(201).json({ 
      success: true, 
      message: 'Data added successfully', 
      id: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /data/:id - Update data
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const updateData = { ...req.body, updatedAt: new Date() };
    const result = await db.collection('example').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Data not found' });
    }
    
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /data/:id - Delete data by ID
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('example').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Data not found' });
    }
    
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;