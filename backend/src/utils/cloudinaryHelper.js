const cloudinary = require("../config/cloudinary");

/** Cloudinary serves PDFs reliably only via /raw/upload — not /image/upload */
const normalizeCloudinaryDeliveryUrl = (url, type) => {
  if (!url || typeof url !== "string") return url;

  let normalized = url;

  const isPdf =
    type === "pdf" ||
    type === "paper" ||
    /\.pdf(\?|$)/i.test(url);

  if (isPdf && normalized.includes("/image/upload/")) {
    normalized = normalized.replace("/image/upload/", "/raw/upload/");
  }

  if (isPdf && normalized.includes("/upload/") && !normalized.includes("/raw/upload/")) {
    normalized = normalized.replace("/upload/", "/raw/upload/");
  }

  return normalized;
};

const extractPublicId = (url) => {
  if (!url || typeof url !== "string") return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^/]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

const deleteCloudinaryAsset = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return;
  const publicId = publicIdOrUrl.includes("http")
    ? extractPublicId(publicIdOrUrl)
    : publicIdOrUrl;
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // ignore cleanup failures
  }
};

module.exports = { extractPublicId, deleteCloudinaryAsset, normalizeCloudinaryDeliveryUrl };