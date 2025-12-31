const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require("../mongo-connection");

const router = express.Router();

// GET /data - Get all chat messages
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const data = await db.collection('chatmessages')
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /data/:id - Get message by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const item = await db.collection('chatmessages').findOne({ _id: new ObjectId(req.params.id) });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /data - Add new chat message
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const newMessage = { 
      ...req.body, 
      timestamp: new Date()
    };
    const result = await db.collection('chatmessages').insertOne(newMessage);
    res.status(201).json({ 
      success: true, 
      message: 'Message added successfully', 
      id: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /data/:id - Update chat message
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const updateData = { ...req.body, updatedAt: new Date() };
    const result = await db.collection('chatmessages').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    res.json({ success: true, message: 'Message updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /data/:id - Delete message by ID
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('chatmessages').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;