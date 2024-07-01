const jwt = require('jsonwebtoken');

class TokenService {

    static isAdmin(decodedToken) {
        return decodedToken.role && decodedToken.role.name.includes("admin");
    }

    static hasAllowedAction(decodedToken, allowedActions) {
        return decodedToken.role && allowedActions.some(action => decodedToken.role.permissions.includes(action));
    }

    static isAuthenticated(req) {
        const token = req.headers.authorization;
        return !!token;
    }

    static checkQueryParams(req) {
        const { userId, name, phoneNumber, servicerequestId, year, month, orderId, categoryId, status, search } = req.query;
        return (userId || name || phoneNumber || servicerequestId || year || orderId || month || categoryId || status || search);
    }

    static checkPermission(allowedActions) {
        return async (req, res, next) => {
            if (!TokenService.isAuthenticated(req)) {
                return res.status(401).json({ message: "Invalid token, you do not have access to call this" });
            }

            try {
                const decodedToken = await TokenService.decodeToken(req.headers.authorization);
                const hasPermission = TokenService.hasAllowedAction(decodedToken, allowedActions) || TokenService.checkQueryParams(req);

                if (hasPermission) {
                    next();
                } else {
                    return res.status(403).json({ message: "You do not have permission to call this API" });
                }
            } catch (error) {
                return res.status(500).json({ message: "Token verification failed" });
            }
        };
    }

    static async decodeToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.API_SECRET);
            return decoded;
        } catch (error) {
            console.error('Token verification error:', error.message);
            throw new Error('Token verification failed');
        }
    }
}

module.exports = TokenService;