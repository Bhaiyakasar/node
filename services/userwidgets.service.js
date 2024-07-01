const UserwidgetsModel = require("../schema/userwidgets.schema");
const WidgetsModel = require("../schema/widgets.schema")
const BaseService = require("@baapcompany/core-api/services/base.service");

class UserwidgetsService extends BaseService {
    constructor(dbModel, entityName) {
        super(dbModel, entityName);
    }

    async createOrUpdateUserWidget(data) {
        const { groupId, userId, widgetId } = data;

        const existingUserWidget = await UserwidgetsModel.findOne({ groupId, userId, widgetId });

        if (existingUserWidget) {
            return await this.updateUserWidget(groupId, existingUserWidget.userwidgetId, data);
        } else {
            const userwidgetId = +Date.now();
            data.userwidgetId = userwidgetId;
            return await this.createUserWidget(data);
        }
    }

    async createUserWidget(data) {
        try {
            const newUserWidget = new UserwidgetsModel(data);
            const savedUserWidget = await newUserWidget.save();
            return { success: true, data: savedUserWidget };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateUserWidget(groupId, userwidgetId, data) {
        try {
            const updatedUserWidget = await UserwidgetsModel.findOneAndUpdate(
                { groupId, userwidgetId },
                data,
                { new: true }
            );
            return { massage: 'UserWigest Update Sucsefully', data: updatedUserWidget };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserWidgets(groupId, userwidgetId, userId, appId, page, pageSize) {
        try {
            let query = { groupId: groupId };

            if (userwidgetId) {
                query.userwidgetId = userwidgetId;
            }
            if (userId) {
                query.userId = userId;
            }
            if (appId) {
                query.appId = appId;
            }

            const totalItems = await UserwidgetsModel.countDocuments(query);
            const totalPages = Math.ceil(totalItems / pageSize);

            let userWidgets = await UserwidgetsModel.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean();

            for (const userWidget of userWidgets) {
                const widgetDetails = await WidgetsModel.find({ widgetId: { $in: userWidget.widgetId } }).lean();
                userWidget.widgets = widgetDetails.map(widget => ({
                    name: widget.name,
                    widgetId: widget.widgetId,
                    appId: widget.appId
                }));
            }

            return {
                data: {
                    message: "Data fetched successfully",
                    items: userWidgets,
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: totalItems
                }
            };
        } catch (error) {
            throw new Error('Error fetching user widgets: ' + error.message);
        }
    }

    async deleteUserWidget(groupId, userwidgetId) {
        try {
            const result = await UserwidgetsModel.deleteOne({ groupId, userwidgetId });
            if (result.deletedCount > 0) {
                return { success: true };
            } else {
                return { success: false, error: "UserWidget not found" };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }


}

module.exports = new UserwidgetsService(UserwidgetsModel, 'userwidgets');
