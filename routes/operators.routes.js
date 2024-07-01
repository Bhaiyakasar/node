const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/operators.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");

router.post("/", checkSchema(require("../dto/operators.dto")), async (req, res, next) => {
  if (ValidationHelper.requestValidationErrors(req, res)) {
    return;
  }
  const operatorId = +Date.now()
  req.body.operatorId = operatorId

  const { groupId, phoneNumber } = req.body;

  const existingoprater = await service.findByPhoneNumber(groupId, phoneNumber);
  if (existingoprater) {
    return res.status(400).json({ error: " This Phonenumber operators is already exists" });
  }
  const serviceResponse = await service.create(req.body);
  requestResponsehelper.sendResponse(res, serviceResponse);
});

router.delete("/:id", async (req, res) => {
  const serviceResponse = await service.deleteById(req.params.id);

  requestResponsehelper.sendResponse(res, serviceResponse);
});

router.put("/:id", async (req, res) => {
  const serviceResponse = await service.updateById(req.params.id, req.body);

  requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/:id", async (req, res) => {
  const serviceResponse = await service.getById(req.params.id);

  requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/all/operators", async (req, res) => {
  const serviceResponse = await service.getAllByCriteria({});

  requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { role, search, manager, operatorId, page, limit } = req.query;

    const serviceResponse = await service.getAllByGroupIdAndUserId(groupId, search, role, manager, operatorId, page, limit);

    const responseData = {
      status: "Success",
      ...serviceResponse
    };

    requestResponsehelper.sendResponse(res, responseData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/delete/operator", async (req, res) => {
  const { groupId, operatorIds } = req.body;
  try {
    const operators = await service.deleteDataById(groupId, operatorIds);
    if (!operators) {
      return res.status(404).json({ message: "Data not found" });
    }
    res.status(200).json({ message: "Data deleted successfully", data: operators })
  } catch (error) {
    res.status(500).json({ message: "An error occurred while deleting data" });
  }
});

router.get('/member/roles/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const memberRoles = await service.getAllMemberRoles(groupId);
    res.status(200).json({ message: 'Role(s) fetched successfully', data: { roles: memberRoles } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/managers/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const memberRoles = await service.getAllManagerNames(groupId);

    res.status(200).json({ message: 'Manager(s) fetched successfully', data: { manager: memberRoles } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
