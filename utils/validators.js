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
   ============== FULL INQUIRY (WEB FORM) ==================
   ========================================================= */

const validateInquiryLead = ({
  name,
  phone,
  email,
  city,
  vehicleName,
  message,
}) => {

  const errors = {};

  if (
    !isValidName(name)
  ) {

    errors.name =
      "Valid name required";
  }

  if (
    !isValidIndianPhone(phone)
  ) {

    errors.phone =
      "Valid mobile number required";
  }

  if (
    !isValidEmail(email)
  ) {

    errors.email =
      "Valid email required";
  }

  if (
    !city ||
    cleanString(city).length < 2
  ) {

    errors.city =
      "City is required";
  }

  if (
    !vehicleName ||
    cleanString(vehicleName).length < 2
  ) {

    errors.vehicleName =
      "Interested vehicle is required";
  }

  if (
    message &&
    cleanString(message).length > 2000
  ) {

    errors.message =
      "Message too long (max 2000 characters)";
  }

  return {

    isValid:
      Object.keys(errors).length === 0,

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

const validateDealerSignup = ({
  dealershipName,
  contactName,
  email,
  phone,
  citySlug,
  brands,
}) => {
  const errors = [];

  if (!isValidName(dealershipName)) {
    errors.push("Dealership name required");
  }

  if (!isValidName(contactName)) {
    errors.push("Contact name required");
  }

  if (!isValidEmail(email)) {
    errors.push("Valid email required");
  }

  if (!isValidIndianPhone(phone)) {
    errors.push("Valid Indian phone required");
  }

  if (!citySlug || !String(citySlug).trim()) {
    errors.push("City selection required");
  }

  const brandList = Array.isArray(brands) ? brands : [];
  if (!brandList.length) {
    errors.push("Select at least one brand");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateDealerCreate = ({
  name,
  email,
  password,
}) => {

  const errors = [];

  if (
    !isValidName(name)
  ) {

    errors.push(
      "Name required"
    );
  }

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

  validateInquiryLead,

  validateLogin,

  validateUser,

  validateCar,

  validateDealerCreate,

  validateDealerSignup,
};