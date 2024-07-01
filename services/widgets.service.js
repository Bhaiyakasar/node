const WidgetsModel = require("../schema/widgets.schema");
const BaseService = require("@baapcompany/core-api/services/base.service");

class WidgetsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async getWidgets(widgetId, appId, page, pageSize) {
        try {
            let query = { appId: appId };

            if (widgetId) {
                query.widgetId = widgetId;
            }

            const totalItems = await WidgetsModel.countDocuments(query);
            const totalPages = Math.ceil(totalItems / pageSize);

            const widgets = await WidgetsModel.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize);

            return {
                message: 'Widgets fetched successfully',
                data: {
                    items: widgets,
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: totalItems
                }
            };
        } catch (error) {
            throw new Error('Error fetching widgets: ' + error.message);
        }
    }

    async deleteUserWidget( widgetId) {
        try {
            const result = await WidgetsModel.deleteOne({ widgetId });
            if (result.deletedCount > 0) {
                return { success: true };
            } else {
                return { success: false, error: "WidgetId not found" };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new WidgetsService(WidgetsModel, 'widgets');
