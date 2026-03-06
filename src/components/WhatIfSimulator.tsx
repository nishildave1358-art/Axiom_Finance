import { useMemo, useState, useEffect } from "react";
import { formatCurrency } from "../lib/utils";
import { TrendingUp, TrendingDown, Plus, Trash2, Zap, LayoutPanelLeft } from "lucide-react";
import { toast } from "sonner";
import { apiJson } from "../lib/api";

const PRESETS = [
  { id: 'hire-dev', label: 'Hire a Developer', type: 'expense', amount: 150000, category: 'Payroll' },
  { id: 'enterprise-deal', label: 'Enterprise Deal', type: 'income', amount: 800000, category: 'Sales' },
  { id: 'office-rent', label: 'New Office Space', type: 'expense', amount: 45000, category: 'Rent' },
  { id: 'side-hustle', label: 'Consulting Project', type: 'income', amount: 120000, category: 'Services' },
];

export function WhatIfSimulator({ onApply }: { onApply: (results: any) => void }) {
  const [changes, setChanges] = useState<any[]>([]);
  const [newChange, setNewChange] = useState({ type: "income", category: "", amount: "" });
  const [isRunning, setIsRunning] = useState(false);
  const [baseline, setBaseline] = useState<any>(null);

  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const data = await apiJson<{ wallet: any; analytics: any }>("/api/dashboard");
        setBaseline(data);
      } catch (e) {
        console.error("Failed to fetch baseline for simulator", e);
      }
    };
    fetchBaseline();
  }, []);

  const parsedChanges = useMemo(() => {
    return changes.map((c) => ({
      type: c.type,
      category: c.category,
      amount: Number(c.amount) || 0,
    }));
  }, [changes]);

  const handleAddChange = () => {
    if (!newChange.category || !newChange.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const change = {
      id: Date.now().toString(),
      ...newChange,
      amount: parseFloat(newChange.amount)
    };

    setChanges([...changes, change]);
    setNewChange({ type: "income", category: "", amount: "" });
  };

  const handleRemoveChange = (id: string) => {
    setChanges(changes.filter(change => change.id !== id));
  };

  const handleApply = () => {
    if (changes.length === 0) {
      toast.error("Add at least one change to run the simulation");
      return;
    }

    void (async () => {
      try {
        setIsRunning(true);
        const data = await apiJson<{ results: any; runId: string }>("/api/simulations/run", {
          method: "POST",
          body: JSON.stringify({ changes: parsedChanges }),
        });
        onApply(data.results);
        toast.success("Simulation run saved locally!");
      } catch (e: any) {
        toast.error(e?.message || "Simulation failed");
      } finally {
        setIsRunning(false);
      }
    })();
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    const change = {
      id: `preset-${Date.now()}-${preset.id}`,
      type: preset.type,
      category: preset.category,
      amount: preset.amount,
    };
    setChanges([...changes, change]);
    toast.info(`Added preset: ${preset.label}`);
  };

  const handleReset = () => {
    setChanges([]);
  };

  const currentRunway = baseline?.wallet?.runwayDays || 0;
  const currentBurn = baseline?.analytics?.monthlyBurnRate || 0;
  const currentCash = baseline?.wallet?.availableCash || 0;

  const simulatedResults = useMemo(() => {
    if (changes.length === 0) return null;
    let delta = 0;
    let netMonthlyChange = 0;

    changes.forEach(c => {
      const amt = Number(c.amount) || 0;
      if (c.type === 'income') {
        delta += amt;
        netMonthlyChange += amt;
      } else {
        delta -= amt;
        netMonthlyChange -= amt;
      }
    });

    const projectedBalance = Math.max(0, currentCash + delta);
    const adjustedBurn = Math.max(1, currentBurn - netMonthlyChange);
    const newRunway = Math.round((projectedBalance / Math.max(1, adjustedBurn)) * 30);

    return {
      runway: newRunway,
      balance: projectedBalance,
      delta: newRunway - currentRunway
    };
  }, [changes, currentCash, currentBurn, currentRunway]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">What-If Simulator</h2>
        <p className="text-slate-400 mt-1">Test different scenarios to see their impact on your finances</p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 border border-white/5">
          <div className="text-slate-400 text-sm">Current Runway</div>
          <div className="text-2xl font-bold text-white mt-1">{currentRunway} days</div>
          {simulatedResults && (
            <div className={`text-xs mt-1 ${simulatedResults.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {simulatedResults.delta >= 0 ? '+' : ''}{simulatedResults.delta} days projected
            </div>
          )}
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/5">
          <div className="text-slate-400 text-sm">Monthly Burn</div>
          <div className="text-2xl font-bold text-white mt-1">{formatCurrency(currentBurn, "INR")}</div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-white/5">
          <div className="text-slate-400 text-sm">Available Cash</div>
          <div className="text-2xl font-bold text-white mt-1">{formatCurrency(currentCash, "INR")}</div>
          {simulatedResults && (
            <div className="text-xs text-slate-400 mt-1">
              Proj: {formatCurrency(simulatedResults.balance, "INR")}
            </div>
          )}
        </div>
      </div>

      {/* Presets */}
      <div className="glass-card rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-white">Quick Simulation Presets</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="p-3 text-left rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="text-xs text-slate-400 mb-1">{preset.category}</div>
              <div className="font-medium text-white group-hover:text-primary transition-colors">{preset.label}</div>
              <div className={`text-sm mt-1 font-bold ${preset.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {preset.type === 'income' ? '+' : '-'}{formatCurrency(preset.amount, "INR")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Changes */}
      <div className="glass-card rounded-xl p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4">Custom Change</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={newChange.type}
            onChange={(e) => setNewChange({ ...newChange, type: e.target.value })}
            className="glass-input"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <input
            type="text"
            placeholder="Category"
            value={newChange.category}
            onChange={(e) => setNewChange({ ...newChange, category: e.target.value })}
            className="glass-input"
          />

          <input
            type="number"
            placeholder="Amount"
            value={newChange.amount}
            onChange={(e) => setNewChange({ ...newChange, amount: e.target.value })}
            className="glass-input"
          />

          <button
            onClick={handleAddChange}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Changes List */}
      {changes.length > 0 && (
        <div className="glass-card rounded-xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Proposed Changes</h3>

          <div className="space-y-3">
            {changes.map((change) => (
              <div key={change.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  {change.type === "income" ? (
                    <TrendingUp className="text-emerald-400" size={20} />
                  ) : (
                    <TrendingDown className="text-red-400" size={20} />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      {change.type === "income" ? "+" : "-"}
                      {formatCurrency(change.amount, "INR")} {change.category}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveChange(change.id)}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-white/20 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className={`px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors ${isRunning ? "opacity-70 cursor-not-allowed" : ""}`}
              disabled={isRunning}
            >
              {isRunning ? "Running…" : "Save Simulation"}
            </button>
          </div>
        </div>
      )}

      {/* Projection Impact */}
      <div className="glass-card rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <LayoutPanelLeft size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-white">Projected Impact</h3>
        </div>

        {changes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-white/5 rounded-xl border border-dashed border-white/10">
            Add changes or select a preset to see projections
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-slate-400 mb-1">New Exit Runway</div>
                <div className="text-3xl font-black text-white">{simulatedResults?.runway} days</div>
                <div className={`text-sm mt-1 font-medium ${simulatedResults?.delta && simulatedResults.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {simulatedResults?.delta && simulatedResults.delta >= 0 ? 'Extends' : 'Shortens'} by {Math.abs(simulatedResults?.delta || 0)} days
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs text-slate-400 mb-1">Projected Cash Balance</div>
                <div className="text-3xl font-black text-white">{simulatedResults ? formatCurrency(simulatedResults.balance, "INR") : "..."}</div>
                <div className="text-xs text-slate-400 mt-1">After all changes are applied</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg shrink-0">
                  <TrendingUp size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Strategy Tip</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {simulatedResults?.delta && simulatedResults.delta > 0
                      ? "Great move! This scenario significantly improves your financial health and buys you more time to focus on growth."
                      : "Note: This scenario increases your monthly burn. Ensure this investment leads to higher revenue or improved efficiency."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}