import { z } from 'zod';

const clean = (max) => z.string().trim().min(1).max(max).transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''));
const isoDate = z.string().datetime({ offset: true });
const id = z.string().trim().max(64);

export const feedbackBody = z.object({
  customer_id: id.optional(),
  order_id: id.optional(),
  source: z.string().trim().min(1).max(32).default('api'),
  source_record_id: z.string().trim().max(128).optional(),
  channel: z.string().trim().min(1).max(32).default('api'),
  rating: z.number().int().min(1).max(5).optional(),
  text: clean(4000),
  timestamp: isoDate.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const websiteFeedbackBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: clean(4000),
  order_reference: id.optional(),
  contact_email: z.string().email().max(190).optional(),
  contact_consent: z.boolean().default(false),
}).refine((b) => !b.contact_email || b.contact_consent, { message: 'contact_consent is required when contact_email is given', path: ['contact_consent'] });

export const googleFormBody = z.object({
  response_id: z.string().trim().min(1).max(128),
  submitted_at: isoDate.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: clean(4000),
  order_reference: id.optional(),
  customer_reference: id.optional(),
});

export const externalImportBody = z.object({
  records: z.array(z.object({
    id: z.string().min(1).max(128),
    text: clean(4000),
    rating: z.number().int().min(1).max(5).optional(),
    customer_id: id.optional(),
    order_id: id.optional(),
    timestamp: isoDate.optional(),
  })).min(1).max(500),
});

export const operationalEventBody = z.object({
  event_type: z.enum(['payment_initiated', 'payment_captured', 'payment_failed', 'payment_reversed', 'order_created', 'order_cancelled',
    'delivery_delayed', 'delivery_completed', 'app_release_deployed', 'weather_alert', 'menu_price_change', 'marketing_campaign',
    'order_draft_created', 'collect_request_sent', 'customer_authorised', 'bank_debit_success', 'bank_debit_failed', 'bank_debit_pending',
    'gateway_callback_received', 'client_confirm_call', 'order_create_failed', 'reversal_initiated', 'reversal_completed']),
  bank: z.string().max(32).optional(),
  payment_gateway: z.string().max(32).optional(),
  psp_app: z.string().max(32).optional(),
  os: z.string().max(16).optional(),
  os_version: z.string().max(16).optional(),
  device_model: z.string().max(32).optional(),
  network_type: z.string().max(16).optional(),
  http_status: z.number().int().optional(),
  latency_ms: z.number().int().nonnegative().optional(),
  error_code: z.string().max(32).optional(),
  event_timestamp: isoDate.optional(),
  customer_id: id.optional(),
  order_id: id.optional(),
  payment_status: z.string().max(24).optional(),
  payment_method: z.string().max(24).optional(),
  amount: z.number().nonnegative().optional(),
  platform: z.string().max(16).optional(),
  device_os: z.string().max(32).optional(),
  app_version: z.string().max(16).optional(),
  city: z.string().max(64).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const incidentBody = z.object({
  title: clean(255),
  description: clean(4000).optional(),
  issue_category: z.enum(['payment', 'delivery', 'pricing', 'food_quality', 'app_ux', 'other']),
  window_start: isoDate.optional(),
});

export const replyBody = z.object({ reply: z.union([z.literal(1), z.literal(2)]), count: z.number().int().min(1).max(500).default(1) });
export const decisionBody = z.object({ comments: clean(1000).optional() });
export const requestApprovalBody = z.object({ recommendation_id: z.number().int().positive(), comments: clean(1000).optional() });
export const loginBody = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });
export const advanceClockBody = z.object({ minutes: z.number().int().min(1).max(1440) });
export const resetBody = z.object({ DEMO_RESET_CONFIRM: z.literal('yes') });

export const evidenceBody = z.object({
  kind: z.enum(['hotfix_deployed', 'new_complaints', 'telemetry_missing', 'support_transcripts', 'other']),
  description: clean(2000),
  feedback_ids: z.array(z.number().int().positive()).max(200).optional(),
  telemetry_available: z.boolean().optional(),
  auto_reassess: z.boolean().default(true),
});
