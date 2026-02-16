const ApiError = require("../utils/apiError");
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log(roles, req.user.role)
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, "Access denied");
        }
        next();
    };
};
module.exports = authorizeRoles;