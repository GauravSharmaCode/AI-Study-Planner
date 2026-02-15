export const MASKED_FIELDS = [
  "password",
  "passwordConfirm",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "clientSecret",
];

export const MASK = "***MASKED***";

/**
 * Recursively masks sensitive fields in an object.
 * @param obj The object to mask.
 * @returns A new object with masked fields.
 */
export const sanitize = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (MASKED_FIELDS.includes(key)) {
        newObj[key] = MASK;
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        newObj[key] = sanitize(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  return newObj;
};
