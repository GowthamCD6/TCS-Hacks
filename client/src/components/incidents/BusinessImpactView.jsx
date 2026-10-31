import React from 'react';
import { Card } from '../common/Card';
import { StatCard } from '../common/StatCard';
import { DollarSign, AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const BusinessImpactView = ({ impact }) => {
  if (!impact) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Business & Financial Impact Analysis</h3>
          <p className="text-xs text-slate-400">
            Differentiating measured transactional telemetry from statistical risk estimates in Indian Rupees (₹)
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Direct Captured Unfulfilled"
          value={formatCurrency(impact.capturedPaymentsWithoutOrders)}
          subtext="Direct measured telemetry from UPI gateway"
          icon={<DollarSign className="w-4 h-4 text-purple-400" />}
          highlight="purple"
        />
        <StatCard
          label="Total Estimated Exposure"
          value={formatCurrency(impact.estimatedRevenueImpact)}
          subtext="Includes churn & recovery costs (Estimate)"
          icon={<AlertCircle className="w-4 h-4 text-rose-400" />}
          highlight="rose"
        />
        <StatCard
          label="Affected Customers"
          value={impact.affectedCustomers?.toLocaleString()}
          subtext="389 total unfulfilled orders"
          icon={<TrendingDown className="w-4 h-4 text-amber-400" />}
          highlight="amber"
        />
        <StatCard
          label="Confirmed Reversals"
          value={formatCurrency(impact.confirmedReversals)}
          subtext="Auto-reversed by customer banks"
          icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
          highlight="emerald"
        />
      </div>

      {/* Breakdown Table with Distinction */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Financial Ledger & Risk Breakdown
          </h4>
          <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Measured vs Estimated
          </span>
        </div>

        <div className="space-y-3">
          {impact.breakdown?.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.isDirect ? 'bg-purple-400' : 'bg-amber-400'
                  }`}
                />
                <div>
                  <span className="font-semibold text-white block">{item.category}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.isDirect ? '✓ Verified Direct Telemetry' : '~ Statistical Risk Estimate'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-white font-mono text-sm sm:text-base">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Audit Note:</strong> Estimated revenue impact includes projected 60-day customer lifetime churn. Direct losses represent verified UPI transactions captured without downstream fulfillment tickets.
          </span>
        </div>
      </Card>
    </div>
  );
};
