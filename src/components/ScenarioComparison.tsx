import { useState, useMemo } from "react";
import { formatCurrency } from "../lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";

// Mock data
const mockWalletSummary = {
  totalBalance: 4250000,
  availableCash: 2550000,
  lockedTaxReserve: 1062500,
  riskZoneCash: 425000,
  futureCommittedCash: 212500,
  currency: "INR",
  lastUpdated: Date.now(),
};

const mockComparison = {
  scenarios: [
    {
      id: "current",
      name: "Current Trajectory",
      description: "Based on current spending and income patterns",
      runwayDays: 73,
      monthlyBurn: 350000,
      projectedBalance: 4250000,
      riskLevel: "healthy",
      color: "#CCFF00"
    },
    {
      id: "conservative",
      name: "Conservative Spending",
      description: "Reduce discretionary spending by 20%",
      runwayDays: 95,
      monthlyBurn: 280000,
      projectedBalance: 4800000,
      riskLevel: "healthy",
      color: "#10B981"
    },
    {
      id: "aggressive",
      name: "Aggressive Growth",
      description: "Increase marketing spend by 50%",
      runwayDays: 52,
      monthlyBurn: 450000,
      projectedBalance: 3800000,
      riskLevel: "warning",
      color: "#F59E0B"
    }
  ],
  recommendations: [
    "Consider the Conservative Spending scenario to extend runway by 30%",
    "Aggressive Growth scenario reduces runway but may increase revenue",
    "Current trajectory is sustainable for the next 2+ months"
  ]
};

export function ScenarioComparison() {
  const [timeRange, setTimeRange] = useState("6months");
  const walletSummary = mockWalletSummary;
  const comparison = mockComparison;

  if (!comparison) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Select scenarios to compare</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Scenario Comparison</h2>
          <p className="text-slate-400 mt-1">Compare different financial strategies</p>
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

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{scenario.name}</h3>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: scenario.color }}
              ></div>
            </div>
            <p className="text-slate-400 text-sm mt-1">{scenario.description}</p>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Runway</span>
                <span className="text-white font-medium">{scenario.runwayDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Burn</span>
                <span className="text-white font-medium">{formatCurrency(scenario.monthlyBurn, "INR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Projected Balance</span>
                <span className="text-white font-medium">{formatCurrency(scenario.projectedBalance, "INR")}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                scenario.riskLevel === "healthy" ? "bg-green-500/10 text-green-400" :
                scenario.riskLevel === "warning" ? "bg-yellow-500/10 text-yellow-400" :
                "bg-red-500/10 text-red-400"
              }`}>
                {scenario.riskLevel.charAt(0).toUpperCase() + scenario.riskLevel.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Runway Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={comparison.scenarios}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              formatter={(value) => [value, 'Days']}
              labelStyle={{ color: '#1F2937' }}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="runwayDays" name="Runway (Days)" fill="#CCFF00" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
        <div className="space-y-3">
          {comparison.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-primary"></div>
              <p className="text-slate-300">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}