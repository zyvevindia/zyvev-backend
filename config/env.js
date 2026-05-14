/* =========================================================
   ================= REQUIRED ENV VARS =====================
   ========================================================= */

const requiredEnv = [

  "MONGO_URI",

  "JWT_SECRET",

  "CLOUDINARY_CLOUD_NAME",

  "CLOUDINARY_API_KEY",

  "CLOUDINARY_API_SECRET",
];

/* =========================================================
   ================= VALIDATE ENV ==========================
   ========================================================= */

const validateEnv = () => {

  const missing = [];

  requiredEnv.forEach((key) => {

    if (!process.env[key]) {

      missing.push(key);
    }
  });

  /* ================= ERROR ================= */

  if (missing.length > 0) {

    console.error(
      "\n❌ Missing environment variables:\n"
    );

    missing.forEach((item) => {

      console.error(
        `- ${item}`
      );
    });

    console.error(
      "\n🛑 Server stopped.\n"
    );

    process.exit(1);
  }

  /* ================= SUCCESS ================= */

  console.log(
    "✅ Environment variables validated"
  );
};

module.exports = validateEnv;