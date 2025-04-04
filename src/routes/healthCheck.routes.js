const { Router } = require("express");
const healthCheck = require("../controllers/healthCheck.controllers");

const router = Router();

router.get("/", healthCheck);

module.exports = router;
