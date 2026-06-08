const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const resolveResourceType = (mimetype, originalname) => {
  const name = (originalname || "").toLowerCase();
  const mime = (mimetype || "").toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "raw";
  if (mime.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv)$/i.test(name)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|aac)$/i.test(name)) return "video";
  return "auto";
};

const uploadToCloudinary = (buffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `luvkush/${folder}`, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

const ALLOWED_STUDENT_FOLDERS = ["payment-proofs", "avatars"];

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const folder = req.body.folder || "materials";

    if (req.user.role === "student" && !ALLOWED_STUDENT_FOLDERS.includes(folder)) {
      return res.status(403).json({ success: false, message: "Students can only upload payment proofs and profile photos" });
    }
    const resourceType = resolveResourceType(req.file.mimetype, req.file.originalname);
    const result = await uploadToCloudinary(req.file.buffer, folder, resourceType);

    let url = result.secure_url;
    if (resourceType === "raw" && url.includes("/image/upload/")) {
      url = url.replace("/image/upload/", "/raw/upload/");
    }

    res.json({
      success: true,
      data: {
        url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadFile };