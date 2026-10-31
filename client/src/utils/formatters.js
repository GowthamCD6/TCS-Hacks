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
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
    case 'high':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
    case 'medium':
      return 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
    case 'low':
      return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
  }
}

export function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'target_met':
    case 'resolved':
    case 'completed':
    case 'approved':
    case 'optimized':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.25)]';
    case 'improving':
    case 'recovery_in_progress':
    case 'running':
    case 'executing':
      return 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]';
    case 'at_risk':
    case 'investigating':
    case 'pending':
    case 'delayed':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
    case 'rejected':
    case 'failed':
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.25)]';
    default:
      return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
  }
}
