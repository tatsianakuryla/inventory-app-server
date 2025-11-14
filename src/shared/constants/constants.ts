export const HASH_WORK_FACTOR = 12 as const;
export const UNIQUE_VALUE_ERROR_CODE = "P2002";
export const FOREIGN_KEY_ERROR_CODE = "P2003";
export const VERSION_CONFLICT_ERROR_CODE = "P2025";
export const VERSION_CONFLICT_ERROR_MESSAGE = "Version conflict";
export const AUTH_COOKIE_NAME = "auth_token" as const;
export const ALLOWED_ORIGINS = ["https://localhost:5173", "http://localhost:5173"];

export const BACKEND_ERRORS = {
  UNAUTHENTICATED: "Unauthenticated",
  INVALID_TOKEN: "Invalid token",
  TOKEN_EXPIRED: "Token expired",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  REFRESH_TOKEN_EXPIRED: "Refresh token expired",
  INVALID_CREDENTIALS: "Invalid credentials",
  ACCOUNT_NOT_ACTIVE: "Account is not active",
  VERSION_CONFLICT: "Version conflict",
  UNAUTHORIZED: "Unauthorized",
  NOT_ADMIN: "Not an admin",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions",

  USER_NOT_FOUND: "User not found",
  USER_BLOCKED: "User is blocked",
  USER_DELETED: "User deleted",
  USER_ALREADY_EXISTS: "User already exists",
  INVALID_EMAIL: "Invalid email format",
  INVALID_PASSWORD: "Invalid password format",

  VALIDATION_ERROR: "Validation error",
  INVALID_INPUT: "Invalid input",
  MISSING_FIELDS: "Missing required fields",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",

  RESOURCE_NOT_FOUND: "Resource not found",
  RESOURCE_ALREADY_EXISTS: "Resource already exists",
  RESOURCE_IN_USE: "Resource is in use",

  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  ACCOUNT_LOCKED: "Account temporarily locked due to too many failed attempts",

  INTERNAL_SERVER_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service unavailable",
  MAINTENANCE_MODE: "Service is under maintenance",

  SOCIAL_AUTH_ERROR: "Social authentication failed",
  SOCIAL_ACCOUNT_LINKED: "Social account already linked",
  SOCIAL_ACCOUNT_NOT_LINKED: "Social account not linked",

  EMAIL_ALREADY_VERIFIED: "Email already verified",
  EMAIL_VERIFICATION_EXPIRED: "Email verification link has expired",
  EMAIL_VERIFICATION_INVALID: "Invalid email verification token",

  PASSWORD_RESET_EXPIRED: "Password reset link has expired",
  INVALID_PASSWORD_RESET_TOKEN: "Invalid password reset token",
} as const;
