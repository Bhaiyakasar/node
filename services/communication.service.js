const CommunicationModel = require("../schema/communication.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");


const Communication = require('../schema/communication.schema');


const CommunicationService = {
    getAllChats: async () => {
      try {
        return await Communication.find().sort({ timestamp: 1 });
      } catch (error) {
        throw new Error('Error while fetching chats');
      }
    },
    saveChat: async (data) => {
      try {
        const newChat = new Communication(data);
        return await newChat.save();
      } catch (error) {
        throw new Error('Error while saving chat');
      }
    },

    // Method to get chats by communicationId
    getChatsByCommunicationId: async (communicationId) => {
        try {
          return await Communication.find({ communicationId}).sort({ timestamp: 1 });
        } catch (error) {
          throw new Error('Error while fetching chats by thread ID');
        }
      }, 
    
    // Method to delete chats by communicationId
    deleteChatsByCommunicationId: async (communicationId) => {
        try {
           return await Communication.deleteMany({ communicationId });
        }  catch (error) {
           throw new Error('Error while deleting chats by thread ID');
        }
    },
    
    };

module.exports = CommunicationService;
