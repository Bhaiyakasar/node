const mongoose = require("mongoose");

const WorkflowSchema = new mongoose.Schema(
    {
        groupId: {
            type: Number,
        },
        event: {
            type: String,
        },
        listener:{
            type: Array,
        },
        workflowId:{
            type: Number,
        }
    },
    { timestamps: true }
);

const WorkflowModel = mongoose.model("workflow", WorkflowSchema);
module.exports = WorkflowModel;
