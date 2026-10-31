/**
 * Domain types and constants for RecoverIQ
 */

export const FEEDBACK_CHANNELS = [
  'website',
  'mobile_app',
  'google_forms',
  'csv',
  'support_ticket',
  'social_media',
];

export const ISSUE_CATEGORIES = [
  'Payment Processing',
  'Authentication',
  'Checkout Delivery',
  'Product Catalog',
  'Order Tracking',
  'Customer Support',
];

export const PAYMENT_STATES = [
  'failed_before_debit',
  'debited_then_reversed',
  'captured_without_order',
  'delivered_with_problem',
  'unknown',
];

