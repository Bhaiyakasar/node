const CallhistoryModel = require("../schema/callhistory.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");
const LeadsModel = require("../schema/leads.schema");

class CallhistoryService extends BaseService {
  constructor(dbModel, entityName) {
    super(dbModel, entityName);
  }
}
// module.exports = {
//   processCallHistoryFile
// };



module.exports = new CallhistoryService(CallhistoryModel, 'callhistory');
