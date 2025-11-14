export const VALIDATION_MESSAGES = {
  NAME_REQUIRED: "Name is required",
  PASSWORD_MIN: "Password must be at least 6 characters",
  EMAIL_INVALID: "Invalid email format",
  CUSTOM_ID_REQUIRED: "Custom ID is required",
  TAG_NAME_REQUIRED: "Tag name is required",
  DESCRIPTION_REQUIRED: "Description is required",
} as const;

export const BATCH_MESSAGES = {
  TOO_MANY_ITEMS: "Too many items",
  TOO_MANY_INVENTORIES: "Too many inventories",
  TOO_MANY_USERS: "Too many users",
  TOO_MANY_TAGS: "Too many tags",
} as const;
