const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/callhistory.service");
const CallhistoryModel = require("../schema/callhistory.schema");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const TokenService = require('../services/token.service')
const LeadsModel = require("../schema/leads.schema");
const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer();

router.post(
    "/",
    checkSchema(require("../dto/callhistory.dto")),
    async (req, res, next) => {
        if (ValidationHelper.requestValidationErrors(req, res)) {
            return;
        }
        const serviceResponse = await service.create(req.body);
        requestResponsehelper.sendResponse(res, serviceResponse);
    }
);

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

router.get("/all/callhistory", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.post('/CallHistoryUpload', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized - Token is Not Found' });
        }
        const token = authHeader.split(' ')[1];
        const decodedToken = await TokenService.decodeToken(token);
        const userId = decodedToken.userId;
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return res.status(400).send('No sheets found in the workbook.');
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length === 0) {
            return res.status(400).send('No data found in the sheet.');
        }

        const headers = jsonData[0];
        const uploadedData = [];

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];

            if (row.every(value => value === null || value === '')) {
                continue;
            }

            const data = createDataObject(headers, row);
            if (Object.keys(data).length > 0) {
                data.createdBy = userId;
                data.updatedBy = userId;

                let lead = await LeadsModel.findOne({ phoneNumber: data.phoneNumber });

                if (!lead) {

                    const leadId = +Date.now();

                    const leadData = {
                        leadId: leadId,
                        phoneNumber: data.phoneNumber,
                        name: data.name,
                        createdBy: userId,
                        updatedBy: userId,
                    };
                    lead = await LeadsModel.create(leadData);
                }
                const callHistoryData = {
                    ...data,
                    leadId: lead.leadId,
                };
                await CallhistoryModel.create(callHistoryData);
                uploadedData.push(data);
            }
        }

        res.status(200).json({
            message: 'File uploaded and processed successfully.',
            uploadedData: uploadedData
        });
    } catch (error) {
        console.error('Error processing file:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

function createDataObject(headers, row) {
    const data = {};
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const value = row[i];

        if (header === 'phoneNumber' && !isNaN(value) && value !== undefined) {
            data[header] = Number(value);
        } else if (header === 'name' && value !== undefined) {
            data[header] = value;
        } else if (value !== undefined) {
            data[header] = value;
        }
    }
    return data;
}

module.exports = router;
