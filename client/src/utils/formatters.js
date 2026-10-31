export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDateTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatPercent(val) {
  const num = Number(val) || 0;
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
}

export function getSeverityBadgeClass(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'badge-failed';
    case 'high':
      return 'badge-failed';
    case 'medium':
      return 'badge-warning';
    case 'low':
      return 'badge-retried';
    default:
      return 'bg-white/5 text-[#9E9BB2] border border-white/10';
  }
}

export function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'target_met':
    case 'resolved':
    case 'completed':
    case 'approved':
    case 'optimized':
    case 'success':
      return 'badge-success';
    case 'improving':
    case 'recovery_in_progress':
    case 'running':
    case 'executing':
      return 'badge-success';
    case 'in_progress':
    case 'in-progress':
    case 'retried':
      return 'badge-retried';
    case 'at_risk':
    case 'investigating':
    case 'pending':
    case 'delayed':
      return 'badge-warning';
    case 'rejected':
    case 'failed':
      return 'badge-failed';
    default:
      return 'bg-white/5 text-[#9E9BB2] border border-white/10';
  }
}
