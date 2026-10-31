import { conflict } from '../utils/errors.js';

export const TRANSITIONS = {
  detected: ['investigating', 'escalated'],
  investigating: ['awaiting_approval', 'detected', 'escalated'],
  awaiting_approval: ['investigating', 'approved', 'rejected', 'escalated'],
  approved: ['investigating', 'awaiting_approval', 'executing', 'escalated'],
  executing: ['monitoring', 'approved', 'escalated'],
  monitoring: ['investigating', 'executing', 'resolved', 'reopened', 'escalated'],
  rejected: ['investigating', 'awaiting_approval', 'escalated'],
  escalated: ['investigating', 'awaiting_approval'],
  reopened: ['investigating', 'awaiting_approval', 'approved', 'executing', 'escalated'],
  resolved: ['reopened'],
};

export const canTransition = (from, to) => from === to || (TRANSITIONS[from] ?? []).includes(to);

export function assertTransition(from, to) {
  if (!canTransition(from, to)) throw conflict(`Incident cannot move from ${from} to ${to}`, { from, to });
}
