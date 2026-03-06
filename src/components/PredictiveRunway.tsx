import { useState, useMemo } from "react";
import { formatCurrency } from "../lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Label } from "recharts";
import { TrendingUp, Calendar, AlertTriangle } from "lucide-react";

interface PredictiveRunwayProps {
  wallet?: {
    availableCash: number;
    runwayDays: number;
  };
  monthlyBurnRate?: number;
}

export function PredictiveRunway({ wallet, monthlyBurnRate = 350000 }: PredictiveRunwayProps) {
  const [timeRange, setTimeRange] = useState("6months");

  const currentCash = wallet?.availableCash || 0;
  const burnRate = monthlyBurnRate || 1;

  // Generate projection data based on real wallet and burn rate
  const projectionData = useMemo(() => {
    const data = [];
    const months = timeRange === "12months" ? 12 : timeRange === "6months" ? 6 : 3;

    for (let i = 0; i <= months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const balance = Math.max(0, currentCash - (burnRate * i));
      data.push({
        month: i === 0 ? "Current" : date.toLocaleString('default', { month: 'short' }),
        balance,
        date: date.toISOString(),
        isProjected: i > 0
      });
    }
    return data;
  }, [currentCash, burnRate, timeRange]);

  // Find the zero balance point
  const zeroPoint = projectionData.find(point => point.balance <= 0);
  const runwayDays = wallet?.runwayDays || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Predictive Runway</h2>
          <p className="text-slate-400 mt-1">Forecast your financial runway based on current trends</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="3months">3 Months</option>
              <option value="6months">6 Months</option>
              <option value="12months">12 Months</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>
      </div>

      {/* Runway Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="text-slate-400 text-sm">Current Runway</div>
          <div className="text-3xl font-bold text-white mt-1">{runwayDays} days</div>
          <div className="text-sm text-green-400 mt-1">Stable trajectory</div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="text-slate-400 text-sm">Monthly Burn Rate</div>
          <div className="text-3xl font-bold text-white mt-1">{formatCurrency(burnRate, "INR")}</div>
          <div className="text-sm text-slate-400 mt-1">Based on trailing 30 days</div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="text-slate-400 text-sm">Projected Depletion</div>
          <div className="text-3xl font-bold text-white mt-1">
            {zeroPoint ? zeroPoint.month : "6+ Months"}
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {zeroPoint ? new Date(zeroPoint.date).toLocaleDateString() : "Sustainable"}
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="glass-card rounded-xl p-6 min-h-[450px]">
        <h3 className="text-lg font-semibold text-white mb-4">Cash Runway Projection</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis
              stroke="#9CA3AF"
              tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), "INR"), 'Balance']}
              labelStyle={{ color: '#1F2937' }}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#CCFF00"
              strokeWidth={3}
              dot={{ fill: '#CCFF00', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            />
            {zeroPoint && (
              <ReferenceDot
                x={zeroPoint.month}
                y={0}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
              >
                <Label
                  value="Runway Ends Here"
                  position="top"
                  fill="#ef4444"
                  fontSize={12}
                  fontWeight="bold"
                />
              </ReferenceDot>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="text-yellow-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Risk Assessment</h3>
              <p className="text-slate-400 text-sm mt-1">73 days runway is healthy</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Safety Threshold</span>
              <span className="text-white">30 days</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: '73%' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Recommendation</h3>
              <p className="text-slate-400 text-sm mt-1">Current trajectory is sustainable</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-300">
            Consider setting aside an additional ₹5,00,000 for emergencies to extend your runway buffer.
          </div>
        </div>
      </div>
    </div>
  );
}

