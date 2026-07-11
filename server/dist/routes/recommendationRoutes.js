"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendationController_1 = require("../controllers/recommendationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const optionalProtect = (req, res, next) => {
    if (req.headers.authorization || (req.cookies && req.cookies.accessToken)) {
        return (0, auth_1.protect)(req, res, next);
    }
    next();
};
// Endpoint is optional-protect (works for guest context too)
router.get('/', optionalProtect, recommendationController_1.getRecommendations);
router.post('/viewed', optionalProtect, recommendationController_1.logProductView);
router.get('/viewed', optionalProtect, recommendationController_1.getRecentlyViewed);
exports.default = router;
