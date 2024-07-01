const express = require("express");
const router = express.Router();
const { checkSchema } = require("express-validator");
const service = require("../services/leads.service");
const requestResponsehelper = require("@baapcompany/core-api/helpers/requestResponse.helper");
const ValidationHelper = require("@baapcompany/core-api/helpers/validation.helper");
const TokenService = require('../services/token.service')
const xlsx = require('xlsx');
const excel = require('exceljs');
const { Readable } = require('stream');
const multer = require('multer');
const upload = multer();


router.post("/", checkSchema(require("../dto/leads.dto")), async (req, res, next) => {
    if (ValidationHelper.requestValidationErrors(req, res)) {
        return;
    }
    const token = req.headers.authorization;
    const decodedToken = await TokenService.decodeToken(token);
    const userId = decodedToken.userId;
    req.body.createdBy = userId;
    req.body.updateBy = userId;

    const { groupId, phoneNumber } = req.body;

    const existingLead = await service.findByPhoneNumber(groupId, phoneNumber);
    if (existingLead) {
        return res.status(400).json({ error: " This Phonenumber lead is already exists" });
    }
    const leadId = +Date.now()
    req.body.leadId = leadId
    const serviceResponse = await service.create(req.body);
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.post('/bulkLeadUpload', upload.single('excelFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - Token is Not Found' });
    }

    const token = authHeader.split(' ')[1];

    const decodedToken = await TokenService.decodeToken(token);
    const groupId = decodedToken.groupId;
    const userId = decodedToken.userId;

    try {

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        const headers = jsonData[0];
        const tag = req.body.tag || "";
        const type = req.body.type || "";
        const source = req.body.source || "";
        const uploadedData = [];


        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];

            const data = createLeadDataObject(headers, row);

            if (row.every(value => value === null || value === '')) {
                continue;
            }

            if (data && Object.keys(data).length > 0) {
                data.groupId = groupId;
                data.tag = tag;
                data.type = type;
                data.source = source;
                data.createdBy = userId;
                data.updatedBy = userId;
                const result = await service.bulkUploadLead(data);
                uploadedData.push(result);
            }
        }

        res.status(200).json({
            message: 'File uploaded and processed successfully.',
            uploadedData: uploadedData,
        });
    } catch (error) {
        console.error('Error processing file:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

function createLeadDataObject(headers, row) {
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

router.get("/all/leads", async (req, res) => {
    const serviceResponse = await service.getAllByCriteria({});

    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.get("/group/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const { userId, assignedTo, createdBy, leadId, type, source, status, location, phoneNumber, page, pageSize, search } = req.query;

    try {
        let leads = await service.getAlleads(groupId, assignedTo, createdBy, userId, leadId, type, source, status, location, phoneNumber, page, pageSize, search);
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/count", async (req, res) => {
    try {
        const { groupId, start_date, end_date, assignedTo, createdBy, userId, leadId, type, source, status, location, phoneNumber, search } = req.body;

        const leadCounts = await service.countLeadsByGroupAndDate(groupId, assignedTo, start_date, end_date, createdBy, userId, leadId, type, source, status, location, phoneNumber, search);

        if (!leadCounts || Object.keys(leadCounts.data.items).length === 0) {
            return res.status(404).json({ message: "No leads found within the specified date range and filters for the given GroupId." });
        }
        res.json(leadCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete("/delete/leads", async (req, res) => {
    const { groupId, leadIds } = req.body;
    try {
        const updatedCampaign = await service.deleteDataById(groupId, leadIds);
        if (!updatedCampaign) {
            return res.status(404).json({ message: "Data not found" });
        }
        res.status(200).json({ message: "Data marked as deleted successfully", data: updatedCampaign })
    } catch (error) {
        res.status(500).json({ message: "An error occurred while deleting data" });
    }
})

router.put("/groupId/:groupId/leadId/:leadId", async (req, res) => {
    const { groupId, leadId } = req.params;
    const newData = req.body;

    let leads = await service.updateLeadsById(groupId, leadId, newData)
    res.json(leads)
})

router.get('/location/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const query = req.query;

        const data = await service.getAllDataByGroupId(groupId, query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/user/leads/:groupId/:empId", async (req, res) => {
    try {
        const { groupId, empId } = req.params;

        const UserLeads = await service.getUserLeads(groupId, empId);

        res.status(200).json({ status: 'Success', massage: 'User leads featch successfully', data: UserLeads });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Internal server error' });
    }

});

router.get('/filteredLeads/:groupId/:empId', async (req, res) => {
    try {
        const { groupId, empId } = req.params;
        const filteredLeads = await service.getFilteredLeads(groupId, empId);
        res.json(filteredLeads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/all/getByGroupId/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const criteria = {
        userId: req.query.userId,
    };

    const serviceResponse = await service.getAllDataByGroupIds(
        groupId,
        criteria
    );
    requestResponsehelper.sendResponse(res, serviceResponse);
});

router.post('/dashbardLeads/counts', async (req, res) => {
    try {
        const { groupId, empId, userId } = req.body;

        if (!groupId) {
            return res.status(400).json({ error: 'groupId must be provided' });
        }

        const counts = await service.getAllByGroupIdAndAssignedToId(groupId, empId, userId);

        res.json({
            message: 'Lead counts fetched successfully',
            items: counts
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/opretor/lead/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const { userId, assignedTo, createdBy, start_date, end_date, page, pageSize, search } = req.query;

    try {
        let leads = await service.getOpretorsAssignedLeads(groupId, assignedTo, createdBy, userId, start_date, end_date, page, pageSize, search);
        res.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/leads/export-to-excel', async (req, res) => {
    const { groupId, date, status, assignedTo } = req.query;

    try {
        const leadsResponse = await service.exportLeadsToExcel(groupId, date, status, assignedTo);
        const leads = leadsResponse.data.items;

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Leads');

        worksheet.columns = [
            { header: 'GroupId', key: 'groupId' },
            { header: 'LeadId', key: 'leadId' },
            { header: 'Name', key: 'name' },
            { header: 'Phone Number', key: 'phoneNumber' },
            { header: 'Location', key: 'location' },
            { header: 'Type', key: 'type' },
            { header: 'Source', key: 'source' },
            { header: 'Call Date', key: 'callDate' },
            { header: 'Time', key: 'Time' },
            { header: 'Status', key: 'status' },
            { header: 'Record Text', key: 'recordText' }
        ];

        leads.forEach(lead => {
            worksheet.addRow(lead);
        });

        const buffer = await workbook.xlsx.writeBuffer();

        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="leads.xlsx"');

        stream.pipe(res);
    } catch (error) {
        console.error('Error exporting leads to Excel:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/leads/download-to-excel/:groupId', async (req, res) => {
    const { groupId } = req.params;

    try {
        const leadsResponse = await service.exportLeadsToExcels(groupId);
        const leads = leadsResponse.data.items;

        const workbook = xlsx.utils.book_new();
        const worksheetData = leads.map(lead => ({
            GroupId: lead.groupId,
            LeadId: lead.leadId,
            Name: lead.name,
            PhoneNumber: lead.phoneNumber, 
            Location: lead.location,
            Type: lead.type,
            Source: lead.source,
            Status: lead.status,
    
        }));
        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads');
        
        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=leads.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting leads to Excel:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/campaignHistory/upload", upload.single("excelFile"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ message: "Unauthorized - Token is Not Found" });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await TokenService.decodeToken(token);
    const groupId = decodedToken.groupId;
    const userId = decodedToken.userId;

    try {
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        const headers = jsonData[0];
        const tag = req.body.tag || "";
        const type = req.body.type || "";
        const source = req.body.source || "";
        const uploadedData = [];

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];

            const data = createLeadDataObject(headers, row);

            if (row.every((value) => value === null || value === "")) {
                continue;
            }

            if (data && Object.keys(data).length > 0) {
                data.groupId = groupId;
                data.tag = tag;
                data.type = type;
                data.source = source;
                data.createdBy = userId;
                data.updatedBy = userId;
                const result = await service.campaignHistory(data);
                uploadedData.push(result);
            }
        }

        res.status(200).json({
            message: "File uploaded and processed successfully."
        });
    } catch (error) {
        console.error("Error processing file:", error.message);
        res.status(500).send("Internal Server Error");
    }
});

function createLeadDataObject(headers, row) {
    const data = {};
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const value = row[i];

        if (header === "phoneNumber" && !isNaN(value) && value !== undefined) {
            data[header] = Number(value);
        } else if (header === "name" && value !== undefined) {
            data[header] = value;
        } else if (value !== undefined) {
            data[header] = value;
        }
    }
    return data;
}
module.exports = router;
