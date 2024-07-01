const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/communication.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

// Get all chats
router.get('/', async (req, res) => {
    try {
      const chats = await service.getAllChats();
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Send a message
  router.post('/send', async (req, res) => {
    try {
      const { sender, receiver, message } = req.body;
      const newChat = await service.saveChat({ sender, receiver, message });
      res.json(newChat);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Customer sends a message to L1 Team
  router.post('/send-customer', async (req, res) => {
    try {
      const { receiver,handledBy, message, custId ,groupId } = req.body;
      const communicationId = req.body.communicationId;

      if(!communicationId){
          const newCommunicationId = +Date.now();
          const newChat = await service.saveChat({ custId, receiver, handledBy, message, groupId, communicationId: newCommunicationId});
          return res.json(newChat);
        }
      const newChat = await service.saveChat({ custId, receiver, handledBy, message, groupId, communicationId});
      res.json(newChat);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // L1 Team sends a message to Customer
  router.post('/send-L1', async (req, res) => {
    try {
      const { receiver, message, custId, handledBy ,sender, groupId} = req.body;
      const communicationId = req.body.communicationId; 
      const newChat = await service.saveChat({ sender, receiver, custId, message, communicationId, groupId, handledBy});
      res.json(newChat);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get chats by groupId and communicationId
router.get('/:groupId/:communicationId', async (req, res) => {
    try {
      const communicationId = req.params.communicationId;
      const chats = await service.getChatsByCommunicationId(communicationId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete chats by groupId and communicationId
router.delete('/:groupId/:communicationId', async (req, res) => {
    try {
      const communicationId = req.params.communicationId;
      const result = await service.deleteChatsByCommunicationId(communicationId);
      res.json({ message: `Deleted ${result.deletedCount} chats for communicationId: ${communicationId}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
