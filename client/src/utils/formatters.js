export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return String(isoString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(isoString);
  }
}

export function formatPercent(val) {
  const num = Number(val) || 0;
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
}

export function formatConfidence(score) {
  if (score === null || score === undefined) return '—';
  const num = Number(score);
  const pct = num <= 1 ? Math.round(num * 100) : Math.round(num);
  return `${pct}%`;
}

export function formatSeverity(severity) {
  if (typeof severity === 'number') {
    if (severity >= 0.8) return 'Critical';
    if (severity >= 0.6) return 'High';
    if (severity >= 0.3) return 'Medium';
    return 'Low';
  }
  if (!severity) return 'Low';
  return String(severity).charAt(0).toUpperCase() + String(severity).slice(1);
}

export function getSeverityBadgeClass(severity) {
  const num = typeof severity === 'number' ? severity : null;
  const str = String(severity || '').toLowerCase();

  if (num !== null) {
    if (num >= 0.6) return 'badge-failed';
    if (num >= 0.3) return 'badge-warning';
    return 'badge-retried';
  }

  if (str === 'critical' || str === 'high') return 'badge-failed';
  if (str === 'medium' || str === 'amber' || str === 'at_risk') return 'badge-warning';
  if (str === 'low') return 'badge-retried';
  return 'bg-white/5 text-[#9E9BB2] border border-white/10';
}

export function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'resolved':
    case 'recovered':
    case 'approved':
    case 'supported':
    case 'executed':
      return 'badge-success';
    case 'executing':
    case 'monitoring':
    case 'watch':
      return 'badge-retried';
    case 'investigating':
    case 'awaiting_approval':
    case 'pending':
    case 'open':
    case 'not_recovered':
    case 'untested':
      return 'badge-warning';
    case 'rejected':
    case 'escalated':
    case 'reopened':
    case 'incident':
      return 'badge-failed';
    case 'explained':
    case 'overlapping':
    case 'superseded':
    case 'inconclusive':
    default:
      return 'bg-white/5 text-[#9E9BB2] border border-white/10';
  }
}

export function snakeToTitle(str) {
  if (!str) return '';
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
