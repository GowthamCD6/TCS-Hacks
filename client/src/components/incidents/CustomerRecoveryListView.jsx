import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Users, CheckCircle, XCircle, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const CustomerRecoveryListView = ({
  entries = [],
  onTriggerReconciliation,
}) => {
  const getPaymentStateBadge = (state) => {
    switch (state) {
      case 'captured_without_order':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Captured Without Order (Owed)
          </span>
        );
      case 'debited_then_reversed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> Debited Then Reversed
          </span>
        );
      case 'failed_before_debit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <XCircle className="w-3.5 h-3.5 text-slate-400" /> Failed Before Debit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Delivered With Problem
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Customer Recovery Ledger</h3>
            <p className="text-xs text-slate-400">
              Deterministic transaction state audit: Finds customers with money captured but no order
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onTriggerReconciliation}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Execute Batch Reconciliation (342 Users)
        </Button>
      </div>

      {/* Deterministic Rule Guardrail Notice */}
      <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
        <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">TCS Challenge 06 Rule: "Nobody is refunded just for complaining"</span>
          <p className="text-slate-300 leading-relaxed">
            Refunds and order rehydrations are restricted strictly to customers verified in <code>captured_without_order</code> state. Transactions in <code>debited_then_reversed</code> are flagged ineligible to prevent fraudulent double-credits.
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#120d24] text-slate-400 uppercase text-[10px] font-mono border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Customer Ref</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Transaction State</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Refund Eligibility</th>
                <th className="py-3 px-4">Prescribed Remedy</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-purple-900/10 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-purple-300">{entry.id}</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    <div>{entry.customerName}</div>
                    <span className="text-[11px] text-slate-400 font-mono">{entry.customerRef}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                    {entry.transactionRef}
                  </td>
                  <td className="py-3 px-4">{getPaymentStateBadge(entry.paymentState)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="py-3 px-4">
                    {entry.eligibleForRefund ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Ineligible
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-300 max-w-xs">{entry.remedyAction}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="status" value={entry.status}>
                      {entry.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
