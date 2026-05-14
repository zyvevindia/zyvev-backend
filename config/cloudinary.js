/* =========================================================
   ====================== IMPORTS ==========================
   ========================================================= */

const cloudinary =
  require("cloudinary").v2;

const {
  CloudinaryStorage,
} = require(
  "multer-storage-cloudinary"
);

/* =========================================================
   ==================== CLOUDINARY =========================
   ========================================================= */

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET,
});

/* =========================================================
   ======================= STORAGE =========================
   ========================================================= */

const storage =
  new CloudinaryStorage({
    cloudinary,

    params: async (
      req,
      file
    ) => ({
      folder: "zyvev",

      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "webp",
      ],

      transformation: [
        {
          width: 1600,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    }),
  });

/* =========================================================
   ======================= EXPORTS =========================
   ========================================================= */

module.exports = {
  cloudinary,
  storage,
};