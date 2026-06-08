const express = require("express");
const {
  getCertificates,
  issueCertificate,
  verifyCertificate,
  renderCertificate,
} = require("../controllers/certificateController");
const { protect, protectStream, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/verify/:id", verifyCertificate);
router.get("/render/:id", protectStream, renderCertificate);
router.get("/", protect, getCertificates);
router.post("/", protect, authorize("admin"), issueCertificate);

module.exports = router;