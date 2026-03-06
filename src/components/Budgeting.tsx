import { useState } from "react";
import { formatCurrency } from "../lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Plus, Edit3, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";

// Mock data
const mockWalletDetails = {
  id: "1",
  userId: "1",
  totalBalance: 4250000,
  availableCash: 2550000,
  lockedTaxReserve: 1062500,
  riskZoneCash: 425000,
  futureCommittedCash: 212500,
  currency: "INR",
  region: "IN",
  isSimulationActive: false,
  lastUpdated: Date.now(),
};

const mockBudgets = [
  {
    id: "1",
    name: "Office Expenses",
    allocated: 300000,
    spent: 180000,
    category: "business",
    period: "monthly"
  },
  {
    id: "2",
    name: "Marketing",
    allocated: 200000,
    spent: 150000,
    category: "marketing",
    period: "monthly"
  },
  {
    id: "3",
    name: "Software Subscriptions",
    allocated: 50000,
    spent: 45000,
    category: "software",
    period: "monthly"
  }
];

export function Budgeting() {
  const [budgets, setBudgets] = useState(mockBudgets);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [newBudget, setNewBudget] = useState({
    name: "",
    allocated: "",
    category: "business",
    period: "monthly"
  });


  const handleAddBudget = () => {
    if (!newBudget.name || !newBudget.allocated) {
      toast.error("Please fill in all required fields");
      return;
    }

    const budget = {
      id: Date.now().toString(),
      ...newBudget,
      allocated: parseFloat(newBudget.allocated),
      spent: 0
    };

    setBudgets([...budgets, budget]);
    setNewBudget({ name: "", allocated: "", category: "business", period: "monthly" });
    setIsAdding(false);
    toast.success("Budget added successfully!");
  };

  const handleUpdateBudget = () => {
    if (!editingBudget.name || !editingBudget.allocated) {
      toast.error("Please fill in all required fields");
      return;
    }

    setBudgets(budgets.map(budget =>
      budget.id === editingBudget.id ? { ...editingBudget, allocated: parseFloat(editingBudget.allocated) } : budget
    ));
    setEditingBudget(null);
    toast.success("Budget updated successfully!");
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter(budget => budget.id !== id));
    toast.success("Budget deleted successfully!");
  };

  // Calculate total allocated and spent
  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remainingBudget = totalAllocated - totalSpent;

  // Prepare data for charts
  const budgetData = budgets.map(budget => ({
    name: budget.name,
    value: budget.allocated,
    spent: budget.spent
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Budget Management</h2>
          <p className="text-slate-400 mt-1">Plan and track your spending</p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          Add Budget
        </button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Allocated</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalAllocated, "INR")}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Spent</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalSpent, "INR")}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-slate-400 text-sm">Remaining</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(remainingBudget, "INR")}
          </div>
        </div>
      </div>

      {/* Add Budget Form */}
      {(isAdding || editingBudget) && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingBudget ? "Edit Budget" : "Add New Budget"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Budget Name *
              </label>
              <input
                type="text"
                value={editingBudget ? editingBudget.name : newBudget.name}
                onChange={(e) =>
                  editingBudget
                    ? setEditingBudget({ ...editingBudget, name: e.target.value })
                    : setNewBudget({ ...newBudget, name: e.target.value })
                }
                className="w-full glass-input"
                placeholder="e.g., Office Expenses"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Allocated Amount *
              </label>
              <input
                type="number"
                value={editingBudget ? editingBudget.allocated : newBudget.allocated}
                onChange={(e) =>
                  editingBudget
                    ? setEditingBudget({ ...editingBudget, allocated: e.target.value })
                    : setNewBudget({ ...newBudget, allocated: e.target.value })
                }
                className="w-full glass-input"
                placeholder="Enter allocated amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                value={editingBudget ? editingBudget.category : newBudget.category}
                onChange={(e) =>
                  editingBudget
                    ? setEditingBudget({ ...editingBudget, category: e.target.value })
                    : setNewBudget({ ...newBudget, category: e.target.value })
                }
                className="w-full glass-input"
              >
                <option value="business">Business</option>
                <option value="marketing">Marketing</option>
                <option value="software">Software</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Period
              </label>
              <select
                value={editingBudget ? editingBudget.period : newBudget.period}
                onChange={(e) =>
                  editingBudget
                    ? setEditingBudget({ ...editingBudget, period: e.target.value })
                    : setNewBudget({ ...newBudget, period: e.target.value })
                }
                className="w-full glass-input"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingBudget(null);
              }}
              className="px-4 py-2 border border-white/20 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingBudget ? handleUpdateBudget : handleAddBudget}
              className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              {editingBudget ? "Update Budget" : "Add Budget"}
            </button>
          </div>
        </div>
      )}

      {/* Budget Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Chart */}
        <div className="glass-card rounded-xl p-6 min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-4">Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value), "INR"), 'Amount']}
                labelStyle={{ color: '#1F2937' }}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Spending vs Budget */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Spending vs Budget</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Spent', value: totalSpent },
                  { name: 'Remaining', value: remainingBudget }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#EF4444" />
                <Cell fill="#10B981" />
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value), "INR"), 'Amount']}
                labelStyle={{ color: '#1F2937' }}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Budget Categories</h3>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.allocated) * 100;
            const isOverBudget = percentage > 100;

            return (
              <div key={budget.id} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{budget.name}</div>
                    <div className="text-sm text-slate-400 capitalize">{budget.category} • {budget.period}</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingBudget(budget)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">
                      {formatCurrency(budget.spent, "INR")} of {formatCurrency(budget.allocated, "INR")}
                    </span>
                    <span className={`font-medium ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-primary'
                        }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];