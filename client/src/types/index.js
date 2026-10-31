/**
 * Domain types and status constants for RecoverIQ
 * Matches FastAPI backend enums exactly.
 */

export const INCIDENT_STATUSES = [
  'detected',
  'investigating',
  'awaiting_approval',
  'approved',
  'executing',
  'monitoring',
  'resolved',
  'rejected',
  'escalated',
  'reopened',
];

export const TEST_STATUSES = [
  'supported',
  'rejected',
  'untested',
  'inconclusive',
];

export const HYPOTHESIS_STATUSES = [
  'supported',
  'rejected',
  'untested',
  'inconclusive',
  'overlapping',
];

export const RECOMMENDATION_STATUSES = [
  'proposed',
  'approved',
  'rejected',
  'executed',
  'superseded',
];

export const APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'superseded',
];

export const SIGNAL_STATUSES = [
  'open',
  'watch',
  'explained',
  'incident',
];

export const VERIFICATION_OUTCOMES = [
  'recovered',
  'monitoring',
  'not_recovered',
];

export const EVIDENCE_KINDS = [
  'hotfix_deployed',
  'new_complaints',
  'telemetry_missing',
  'support_transcripts',
  'other',
];

export const FEEDBACK_CHANNELS = [
  'website',
  'mobile_app',
  'google_forms',
  'csv',
  'support_ticket',
  'social_media',
];
