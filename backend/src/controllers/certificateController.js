const Certificate = require("../models/Certificate");
const crypto = require("crypto");

const generateId = () => `LKC-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const buildCertificateHtml = (cert, studentName, programTitle) => {
  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const logoUrl = `${FRONTEND_URL}/logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Certificate — ${programTitle}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .cert{max-width:900px;width:100%;background:#fff;border:8px double #b45309;padding:48px 56px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.12)}
  .cert::before,.cert::after{content:'';position:absolute;width:60px;height:60px;border:3px solid #d97706}
  .cert::before{top:16px;left:16px;border-right:none;border-bottom:none}
  .cert::after{bottom:16px;right:16px;border-left:none;border-top:none}
  .inner{border:2px solid #fbbf24;padding:40px 48px;text-align:center}
  .logo{width:88px;height:88px;object-fit:contain;margin:0 auto 16px}
  .brand{font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#92400e;font-weight:700;margin-bottom:8px}
  h1{font-size:36px;color:#78350f;margin:12px 0;font-weight:400;letter-spacing:1px}
  .subtitle{font-size:14px;color:#a16207;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px}
  .name{font-size:32px;color:#1e293b;font-weight:700;margin:20px 0 8px;border-bottom:2px solid #fbbf24;display:inline-block;padding-bottom:6px;min-width:280px}
  .course{font-size:20px;color:#475569;margin:16px 0 24px;font-style:italic}
  .meta{display:flex;justify-content:center;gap:40px;margin-top:32px;flex-wrap:wrap}
  .meta div{text-align:center}
  .meta label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px}
  .meta span{font-size:15px;color:#334155;font-weight:600}
  .id{margin-top:28px;font-size:11px;color:#94a3b8;font-family:monospace;letter-spacing:1px}
  .seal{margin:24px auto;width:72px;height:72px;border-radius:50%;border:3px solid #d97706;display:flex;align-items:center;justify-content:center;font-size:28px}
  @media print{body{background:#fff;padding:0}.cert{box-shadow:none;border-width:6px}}
</style>
</head>
<body>
  <div class="cert">
    <div class="inner">
      <img class="logo" src="${logoUrl}" alt="Luv Kush Classes"/>
      <p class="brand">Luv Kush Classes</p>
      <div class="seal">🏆</div>
      <h1>Certificate of Completion</h1>
      <p class="subtitle">This is to certify that</p>
      <p class="name">${studentName}</p>
      <p class="course">has successfully completed the certification program<br/><strong>${programTitle}</strong></p>
      <div class="meta">
        <div><label>Score</label><span>${cert.percentage ?? cert.score ?? 0}%</span></div>
        <div><label>Issued On</label><span>${issued}</span></div>
        <div><label>Status</label><span>Verified ✓</span></div>
      </div>
      <p class="id">Certificate ID: ${cert.certificateId}</p>
    </div>
  </div>
  <script>window.onload=function(){/* optional auto-print */}</script>
</body>
</html>`;
};

const getCertificates = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "student") filter.student = req.user._id;

    const certificates = await Certificate.find(filter)
      .populate("student", "name email")
      .populate("course", "name category")
      .populate("program", "title description")
      .sort({ issuedAt: -1 });

    res.json({ success: true, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const issueCertificate = async (req, res) => {
  try {
    const { studentId, courseId, type, score, rank, title, programId, percentage } = req.body;

    const certificate = await Certificate.create({
      student: studentId,
      course: courseId,
      program: programId,
      title,
      type: type || "completion",
      certificateId: generateId(),
      score,
      percentage,
      rank,
    });

    const populated = await Certificate.findById(certificate._id)
      .populate("student", "name email")
      .populate("course", "name")
      .populate("program", "title");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id,
    })
      .populate("student", "name")
      .populate("course", "name")
      .populate("program", "title");

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const renderCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id,
    })
      .populate("student", "name")
      .populate("program", "title");

    if (!certificate) {
      return res.status(404).send("<p>Certificate not found</p>");
    }

    if (req.user && req.user.role === "student" && certificate.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).send("<p>Access denied</p>");
    }

    const studentName = certificate.student?.name || "Student";
    const programTitle = certificate.program?.title || certificate.title || "Certification Program";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildCertificateHtml(certificate, studentName, programTitle));
  } catch (error) {
    res.status(500).send("<p>Failed to render certificate</p>");
  }
};

module.exports = { getCertificates, issueCertificate, verifyCertificate, renderCertificate };