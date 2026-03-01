/**
 * Application-wide constants
 * Centralized location for shared values to avoid duplication
 */

/**
 * Experience levels for user profiles
 */
export const EXPERIENCE_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'expert'
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

/**
 * Available majors/fields of study
 */
export const MAJORS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Engineering',
  'Design',
  'Business',
  'Other',
] as const;

export type Major = typeof MAJORS[number];

/**
 * Project sizes
 */
export const PROJECT_SIZES = ['small', 'medium', 'large'] as const;

export type ProjectSize = typeof PROJECT_SIZES[number];

/**
 * Project durations
 */
export const PROJECT_DURATIONS = ['short', 'medium', 'long'] as const;

export type ProjectDuration = typeof PROJECT_DURATIONS[number];

/**
 * Collaboration styles
 */
export const COLLABORATION_STYLES = [
  'Remote - Async',
  'Remote - Synchronous',
  'In-Person',
  'Hybrid',
  'Flexible',
] as const;

export type CollaborationStyle = typeof COLLABORATION_STYLES[number];

/**
 * Project status values
 */
export const PROJECT_STATUSES = {
  OPEN: 'open',
  CLOSED: 'closed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
} as const;

export type ProjectStatus = typeof PROJECT_STATUSES[keyof typeof PROJECT_STATUSES];
