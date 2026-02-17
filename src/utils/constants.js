// Shared constants and configuration for the grading application.
// Values can be overridden via environment variables where noted.

// --- Grade Scale ---
// Standard letter grade boundaries used across the app.
export const GRADE_BOUNDARIES = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  // Anything below D is F
};

/**
 * Get the letter grade for a given percentage score.
 * Uses the standard A-F scale defined in GRADE_BOUNDARIES.
 */
export function getLetterGrade(percentage) {
  const p = parseFloat(percentage);
  if (p >= GRADE_BOUNDARIES.A) return 'A';
  if (p >= GRADE_BOUNDARIES.B) return 'B';
  if (p >= GRADE_BOUNDARIES.C) return 'C';
  if (p >= GRADE_BOUNDARIES.D) return 'D';
  return 'F';
}

/**
 * Get the grade distribution buckets for a set of percentages.
 */
export function getGradeDistribution(percentages) {
  return {
    [`A (${GRADE_BOUNDARIES.A}-100%)`]: percentages.filter(p => p >= GRADE_BOUNDARIES.A).length,
    [`B (${GRADE_BOUNDARIES.B}-${GRADE_BOUNDARIES.A - 1}%)`]: percentages.filter(p => p >= GRADE_BOUNDARIES.B && p < GRADE_BOUNDARIES.A).length,
    [`C (${GRADE_BOUNDARIES.C}-${GRADE_BOUNDARIES.B - 1}%)`]: percentages.filter(p => p >= GRADE_BOUNDARIES.C && p < GRADE_BOUNDARIES.B).length,
    [`D (${GRADE_BOUNDARIES.D}-${GRADE_BOUNDARIES.C - 1}%)`]: percentages.filter(p => p >= GRADE_BOUNDARIES.D && p < GRADE_BOUNDARIES.C).length,
    [`F (0-${GRADE_BOUNDARIES.D - 1}%)`]: percentages.filter(p => p < GRADE_BOUNDARIES.D).length,
  };
}

// Grade color CSS classes keyed by letter grade
export const GRADE_COLORS = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  F: 'bg-red-100 text-red-800',
};

// Distribution bar colors keyed by distribution label prefix
export const DISTRIBUTION_BAR_COLORS = {
  A: 'bg-green-500',
  B: 'bg-blue-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  F: 'bg-red-500',
};

// --- File Upload ---
// Maximum file size in bytes. Override with NEXT_PUBLIC_MAX_FILE_SIZE_MB env var.
const maxFileSizeMB = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB, 10) || 5;
export const MAX_FILE_SIZE = maxFileSizeMB * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = `${maxFileSizeMB}MB`;

export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

// --- OpenAI ---
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
export const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000;

// --- Rate Limiting ---
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 20;

// --- API ---
export const MAX_INPUT_LENGTH = parseInt(process.env.MAX_INPUT_LENGTH, 10) || 10000;

// --- Supabase Storage ---
export const SUPABASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'student_tests';

// --- Passing threshold ---
export const DEFAULT_PASSING_THRESHOLD = 60;

// --- Topic Mastery ---
export const MASTERY_THRESHOLD = 80;     // >= this is "mastered"
export const DEVELOPING_THRESHOLD = 60;  // >= this is "developing", below is "needs review"
export const REVIEW_THRESHOLD = 70;      // topics below this are recommended for review

// --- API fetch timeout (ms) ---
export const API_FETCH_TIMEOUT_MS = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 10) || 30000;

/**
 * Build standard headers for internal API calls from the client.
 * Includes the API key if configured (via NEXT_PUBLIC_API_KEY).
 */
export function getApiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_KEY
    : undefined;
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}
