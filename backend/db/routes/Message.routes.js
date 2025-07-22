import express from 'express';
import Message from '../db/models/message.model.js';

const router = express.Router();

router.get('/:projectId', async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId }).sort('timestamp');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
