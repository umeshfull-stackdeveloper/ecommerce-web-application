"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assistantController_1 = require("../controllers/assistantController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const optionalProtect = (req, res, next) => {
    if (req.headers.authorization || (req.cookies && req.cookies.accessToken)) {
        return (0, auth_1.protect)(req, res, next);
    }
    next();
};
router.post('/', optionalProtect, assistantController_1.handleAssistantMessage);
exports.default = router;
