import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../lib/utils";
import { Target, Plus, Edit3, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { apiJson } from "../lib/api";

type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: number;
  category: string;
  priority: string;
  isActive: boolean;
  createdAt: number;
};

export function GoalSetting() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    category: "savings",
    priority: "medium",
  });

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        setIsLoading(true);
        const data = await apiJson<{ goals: Goal[] }>("/api/goals");
        if (mounted) setGoals(data.goals);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load goals");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeGoals = useMemo(() => goals.filter((g) => g.isActive), [goals]);

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    void (async () => {
      try {
        const payload = {
          name: newGoal.name,
          targetAmount: parseFloat(newGoal.targetAmount),
          targetDate: new Date(newGoal.deadline).getTime(),
          category: newGoal.category,
          priority: newGoal.priority,
        };
        const data = await apiJson<{ goal: Goal }>("/api/goals", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setGoals((prev) => [data.goal, ...prev]);
        setNewGoal({ name: "", targetAmount: "", deadline: "", category: "savings", priority: "medium" });
        setIsAdding(false);
        toast.success("Goal added successfully!");
      } catch (e: any) {
        toast.error(e?.message || "Failed to add goal");
      }
    })();
  };

  const handleUpdateGoal = () => {
    if (!editingGoal.name || !editingGoal.targetAmount || !editingGoal.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.info("Editing is coming next (live update endpoint). For now, create a new goal / delete old one.");
  };

  const handleDeleteGoal = (id: string) => {
    void (async () => {
      try {
        await apiJson<{ ok: true }>(`/api/goals/${encodeURIComponent(id)}`, { method: "DELETE" });
        setGoals((prev) => prev.filter((g) => g.id !== id));
        toast.success("Goal deleted successfully!");
      } catch (e: any) {
        toast.error(e?.message || "Failed to delete goal");
      }
    })();
  };

  const handleContribute = (id: string, amount: number) => {
    void (async () => {
      try {
        const data = await apiJson<{ goal: Goal }>(`/api/goals/${encodeURIComponent(id)}/contribute`, {
          method: "POST",
          body: JSON.stringify({ amount }),
        });
        setGoals((prev) => prev.map((g) => (g.id === id ? data.goal : g)));
        toast.success(`Contributed ${formatCurrency(amount, "INR")} to goal!`);
      } catch (e: any) {
        toast.error(e?.message || "Failed to contribute");
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Financial Goals</h2>
          <p className="text-slate-400 mt-1">Set and track your financial objectives</p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {/* Add Goal Form */}
      {(isAdding || editingGoal) && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingGoal ? "Edit Goal" : "Add New Goal"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Goal Name *
              </label>
              <input
                type="text"
                value={editingGoal ? editingGoal.name : newGoal.name}
                onChange={(e) =>
                  editingGoal
                    ? setEditingGoal({ ...editingGoal, name: e.target.value })
                    : setNewGoal({ ...newGoal, name: e.target.value })
                }
                className="w-full glass-input"
                placeholder="e.g., Emergency Fund"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Amount *
              </label>
              <input
                type="number"
                value={editingGoal ? editingGoal.targetAmount : newGoal.targetAmount}
                onChange={(e) =>
                  editingGoal
                    ? setEditingGoal({ ...editingGoal, targetAmount: e.target.value })
                    : setNewGoal({ ...newGoal, targetAmount: e.target.value })
                }
                className="w-full glass-input"
                placeholder="Enter target amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Deadline *
              </label>
              <input
                type="date"
                value={editingGoal ? editingGoal.deadline : newGoal.deadline}
                onChange={(e) =>
                  editingGoal
                    ? setEditingGoal({ ...editingGoal, deadline: e.target.value })
                    : setNewGoal({ ...newGoal, deadline: e.target.value })
                }
                className="w-full glass-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                value={editingGoal ? editingGoal.category : newGoal.category}
                onChange={(e) =>
                  editingGoal
                    ? setEditingGoal({ ...editingGoal, category: e.target.value })
                    : setNewGoal({ ...newGoal, category: e.target.value })
                }
                className="w-full glass-input"
              >
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
                <option value="purchase">Purchase</option>
                <option value="debt">Debt Repayment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Priority
              </label>
              <select
                value={editingGoal ? editingGoal.priority : newGoal.priority}
                onChange={(e) =>
                  editingGoal
                    ? setEditingGoal({ ...editingGoal, priority: e.target.value })
                    : setNewGoal({ ...newGoal, priority: e.target.value })
                }
                className="w-full glass-input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingGoal(null);
              }}
              className="px-4 py-2 border border-white/20 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingGoal ? handleUpdateGoal : handleAddGoal}
              className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              {editingGoal ? "Update Goal" : "Add Goal"}
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-slate-400">Loading goals…</div>
        ) : activeGoals.length === 0 ? (
          <div className="text-slate-400">No goals yet. Create one to start tracking.</div>
        ) : (
          activeGoals.map((goal) => (
            <div key={goal.id} className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="text-primary" size={20} />
                    <div className="text-sm text-slate-400">Target: {formatCurrency(goal.targetAmount, "INR")}</div>
                  </div>
                  <div className="text-sm text-slate-400">Deadline: {new Date(goal.targetDate).toLocaleDateString()}</div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">
                    {formatCurrency(goal.currentAmount, "INR")} of {formatCurrency(goal.targetAmount, "INR")}
                  </span>
                  <span className="text-white font-medium">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      goal.priority === "high"
                        ? "bg-red-500/10 text-red-400"
                        : goal.priority === "medium"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    {goal.priority} priority
                  </span>
                </div>

                <div className="text-sm text-slate-400">
                  {Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24)) > 0
                    ? `${Math.ceil((goal.targetDate - Date.now()) / (1000 * 60 * 60 * 24))} days left`
                    : "Overdue"}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {[100000, 500000, 1000000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleContribute(goal.id, amount)}
                    className="flex-1 px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    +{formatCurrency(amount, "INR")}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {goals.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <Target className="text-slate-400 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-white mb-2">No Goals Yet</h3>
          <p className="text-slate-400 mb-4">
            Start setting financial goals to track your progress and stay motivated.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Add Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}