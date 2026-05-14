/* =========================================================
   ===================== CLEAN STRING ======================
   ========================================================= */

const cleanString = (
  value = ""
) => {

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
};

/* =========================================================
   ===================== EMAIL =============================
   ========================================================= */

const isValidEmail = (
  email = ""
) => {

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(
    cleanString(email)
  );
};

/* =========================================================
   ===================== PHONE =============================
   ========================================================= */

const isValidIndianPhone = (
  phone = ""
) => {

  const cleaned =
    String(phone).replace(
      /\D/g,
      ""
    );

  return /^[6-9]\d{9}$/.test(
    cleaned
  );
};

/* =========================================================
   ===================== PASSWORD ==========================
   ========================================================= */

const isStrongPassword = (
  password = ""
) => {

  return password.length >= 6;
};

/* =========================================================
   ===================== SLUG ==============================
   ========================================================= */

const isValidSlug = (
  slug = ""
) => {

  return /^[a-z0-9-]+$/.test(
    cleanString(slug)
  );
};

/* =========================================================
   ===================== PRICE =============================
   ========================================================= */

const isValidPrice = (
  value
) => {

  return (
    !isNaN(value) &&
    Number(value) > 0
  );
};

/* =========================================================
   ===================== NAME ==============================
   ========================================================= */

const isValidName = (
  name = ""
) => {

  return cleanString(name)
    .length >= 2;
};

/* =========================================================
   ===================== SAFE JSON =========================
   ========================================================= */

const safeJsonParse = (
  value,
  fallback = {}
) => {

  try {

    return JSON.parse(value);

  } catch {

    return fallback;
  }
};

/* =========================================================
   ================= LEAD VALIDATION =======================
   ========================================================= */

const validateLead = ({
  name,
  phone,
}) => {

  const errors = [];

  if (
    !isValidName(name)
  ) {

    errors.push(
      "Valid name required"
    );
  }

  if (
    !isValidIndianPhone(phone)
  ) {

    errors.push(
      "Valid mobile number required"
    );
  }

  return {

    isValid:
      errors.length === 0,

    errors,
  };
};

/* =========================================================
   ================= LOGIN VALIDATION ======================
   ========================================================= */

const validateLogin = ({
  email,
  password,
}) => {

  const errors = [];

  if (
    !isValidEmail(email)
  ) {

    errors.push(
      "Valid email required"
    );
  }

  if (
    !isStrongPassword(
      password
    )
  ) {

    errors.push(
      "Password must be minimum 6 characters"
    );
  }

  return {

    isValid:
      errors.length === 0,

    errors,
  };
};

/* =========================================================
   ================= USER VALIDATION =======================
   ========================================================= */

const validateUser = ({
  email,
  password,
  role,
}) => {

  const errors = [];

  const validRoles = [
    "admin",
    "sales",
  ];

  if (
    !isValidEmail(email)
  ) {

    errors.push(
      "Valid email required"
    );
  }

  if (
    !isStrongPassword(
      password
    )
  ) {

    errors.push(
      "Password too weak"
    );
  }

  if (
    !validRoles.includes(
      role
    )
  ) {

    errors.push(
      "Invalid role"
    );
  }

  return {

    isValid:
      errors.length === 0,

    errors,
  };
};

/* =========================================================
   ================= CAR VALIDATION ========================
   ========================================================= */

const validateCar = ({
  name,
  brand,
  slug,
  startingPrice,
}) => {

  const errors = [];

  if (
    !isValidName(name)
  ) {

    errors.push(
      "Car name required"
    );
  }

  if (
    !isValidName(brand)
  ) {

    errors.push(
      "Brand required"
    );
  }

  if (
    !isValidSlug(slug)
  ) {

    errors.push(
      "Invalid slug"
    );
  }

  if (
    !isValidPrice(
      startingPrice
    )
  ) {

    errors.push(
      "Invalid price"
    );
  }

  return {

    isValid:
      errors.length === 0,

    errors,
  };
};

/* =========================================================
   ===================== EXPORTS ===========================
   ========================================================= */

module.exports = {

  cleanString,

  isValidEmail,

  isValidIndianPhone,

  isStrongPassword,

  isValidSlug,

  isValidPrice,

  isValidName,

  safeJsonParse,

  validateLead,

  validateLogin,

  validateUser,

  validateCar,
};