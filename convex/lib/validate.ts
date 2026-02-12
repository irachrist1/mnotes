/**
 * Input validation helpers for Convex functions.
 * These run server-side to prevent abuse even if frontend validation is bypassed.
 */

const MAX_SHORT_TEXT = 200; // titles, names
const MAX_MEDIUM_TEXT = 2000; // descriptions, notes
const MAX_LONG_TEXT = 10000; // AI prompts, business data
const MAX_ARRAY_ITEMS = 50; // tags, skills, etc.
const MAX_API_KEY_LENGTH = 500;

export function validateShortText(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (trimmed.length > MAX_SHORT_TEXT) {
    throw new Error(`${fieldName} must be ${MAX_SHORT_TEXT} characters or less`);
  }
  return trimmed;
}

export function validateMediumText(value: string, fieldName: string): string {
  if (value.length > MAX_MEDIUM_TEXT) {
    throw new Error(`${fieldName} must be ${MAX_MEDIUM_TEXT} characters or less`);
  }
  return value;
}

export function validateLongText(value: string, fieldName: string): string {
  if (value.length > MAX_LONG_TEXT) {
    throw new Error(`${fieldName} must be ${MAX_LONG_TEXT} characters or less`);
  }
  return value;
}

export function validateArray<T>(arr: T[], fieldName: string): T[] {
  if (arr.length > MAX_ARRAY_ITEMS) {
    throw new Error(`${fieldName} must have ${MAX_ARRAY_ITEMS} items or fewer`);
  }
  return arr;
}

export function validateNumber(
  value: number,
  fieldName: string,
  min: number,
  max: number
): number {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return value;
}

export function validateApiKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length > MAX_API_KEY_LENGTH) {
    throw new Error("API key is too long");
  }
  return value;
}
