import { useState } from "react";
import { formatCurrency } from "../lib/utils";
import { CreditCard, Plus, Edit3, Trash2, Check, X, TrendingDown } from "lucide-react";
import { toast } from "sonner";

// Mock data
const mockDebts = [
  {
    id: "1",
    name: "Business Loan",
    principal: 5000000,
    balance: 3200000,
    interestRate: 12.5,
    monthlyPayment: 85000,
    dueDate: 15,
    category: "loan",
    status: "active"
  },
  {
    id: "2",
    name: "Credit Card",
    principal: 200000,
    balance: 75000,
    interestRate: 18.0,
    monthlyPayment: 15000,
    dueDate: 25,
    category: "credit",
    status: "active"
  }
];

const mockWalletSummary = {
  totalBalance: 4250000,
  availableCash: 2550000,
  lockedTaxReserve: 1062500,
  riskZoneCash: 425000,
  futureCommittedCash: 212500,
  currency: "INR",
  lastUpdated: Date.now(),
};

export function DebtManagement() {
  const [debts, setDebts] = useState(mockDebts);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [newDebt, setNewDebt] = useState({
    name: "",
    principal: "",
    interestRate: "",
    monthlyPayment: "",
    dueDate: "",
    category: "loan"
  });


  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.principal || !newDebt.interestRate || !newDebt.monthlyPayment || !newDebt.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const debt = {
      id: Date.now().toString(),
      ...newDebt,
      principal: parseFloat(newDebt.principal),
      balance: parseFloat(newDebt.principal),
      interestRate: parseFloat(newDebt.interestRate),
      monthlyPayment: parseFloat(newDebt.monthlyPayment),
      dueDate: parseInt(newDebt.dueDate),
      status: "active"
    };

    setDebts([...debts, debt]);
    setNewDebt({ name: "", principal: "", interestRate: "", monthlyPayment: "", dueDate: "", category: "loan" });
    setIsAdding(false);
    toast.success("Debt added successfully!");
  };

  const handleUpdateDebt = () => {
    if (!editingDebt.name || !editingDebt.principal || !editingDebt.interestRate || !editingDebt.monthlyPayment || !editingDebt.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setDebts(debts.map(debt =>
      debt.id === editingDebt.id ? {
        ...editingDebt,
        principal: parseFloat(editingDebt.principal),
        balance: parseFloat(editingDebt.balance),
        interestRate: parseFloat(editingDebt.interestRate),
        monthlyPayment: parseFloat(editingDebt.monthlyPayment),
        dueDate: parseInt(editingDebt.dueDate)
      } : debt
    ));
    setEditingDebt(null);
    toast.success("Debt updated successfully!");
  };

  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter(debt => debt.id !== id));
    toast.success("Debt deleted successfully!");
  };

  const handleMakePayment = (id: string, amount: number) => {
    setDebts(debts.map(debt => {
      if (debt.id === id) {
        const newBalance = Math.max(0, debt.balance - amount);
        return { ...debt, balance: newBalance, status: newBalance === 0 ? "paid" : "active" };
      }
      return debt;
    }));
    toast.success(`Payment of ${formatCurrency(amount, "INR")} made successfully!`);
  };

  // Calculate total debt
  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMonthlyPayments = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Debt Management</h2>
          <p className="text-slate-400 mt-1">Track and manage your debts effectively</p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          Add Debt
        </button>
      </div>

      {/* Debt Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-slate-400 text-sm">Total Debt</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalDebt, "INR")}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-slate-400 text-sm">Monthly Payments</div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalMonthlyPayments, "INR")}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-slate-400 text-sm">Debt Items</div>
          <div className="text-2xl font-bold text-white mt-1">
            {debts.length}
          </div>
        </div>
      </div>

      {/* Add Debt Form */}
      {(isAdding || editingDebt) && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingDebt ? "Edit Debt" : "Add New Debt"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Debt Name *
              </label>
              <input
                type="text"
                value={editingDebt ? editingDebt.name : newDebt.name}
                onChange={(e) =>
                  editingDebt
                    ? setEditingDebt({ ...editingDebt, name: e.target.value })
                    : setNewDebt({ ...newDebt, name: e.target.value })
                }
                className="w-full glass-input"
                placeholder="e.g., Business Loan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Principal Amount *
              </label>
              <input
                type="number"
                value={editingDebt ? editingDebt.principal : newDebt.principal}
                onChange={(e) =>
                  editingDebt
                    ? setEditingDebt({ ...editingDebt, principal: e.target.value })
                    : setNewDebt({ ...newDebt, principal: e.target.value })
                }
                className="w-full glass-input"
                placeholder="Enter principal amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interest Rate (%)*
              </label>
              <input
                type="number"
                step="0.1"
                value={editingDebt ? editingDebt.interestRate : newDebt.interestRate}
                onChange={(e) =>
                  editingDebt
                    ? setEditingDebt({ ...editingDebt, interestRate: e.target.value })
                    : setNewDebt({ ...newDebt, interestRate: e.target.value })
                }
                className="w-full glass-input"
                placeholder="Enter interest rate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Monthly Payment *
              </label>
              <input
                type="number"
                value={editingDebt ? editingDebt.monthlyPayment : newDebt.monthlyPayment}
                onChange={(e) =>
                  editingDebt
                    ? setEditingDebt({ ...editingDebt, monthlyPayment: e.target.value })
                    : setNewDebt({ ...newDebt, monthlyPayment: e.target.value })
                }
                className="w-full glass-input"
                placeholder="Enter monthly payment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Due Date (Day of Month) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={editingDebt ? editingDebt.dueDate : newDebt.dueDate}
                onChange={(e) =>
                  editingDebt
                    ? setEditingDebt({ ...editingDebt, dueDate: e.target.value })
                    : setNewDebt({ ...newDebt, dueDate: e.target.value })
                }
                className="w-full glass-input"
                placeholder="Enter due date (1-31)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                value={editingDebt ? editingDebt.category : newDebt.category}
                onChange={(e) =>
                  editingDebt
                    ? setEditingDebt({ ...editingDebt, category: e.target.value })
                    : setNewDebt({ ...newDebt, category: e.target.value })
                }
                className="w-full glass-input"
              >
                <option value="loan">Loan</option>
                <option value="credit">Credit Card</option>
                <option value="mortgage">Mortgage</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingDebt(null);
              }}
              className="px-4 py-2 border border-white/20 rounded-lg text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingDebt ? handleUpdateDebt : handleAddDebt}
              className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              {editingDebt ? "Update Debt" : "Add Debt"}
            </button>
          </div>
        </div>
      )}

      {/* Debt List */}
      <div className="space-y-4">
        {debts.map((debt) => {
          const progress = ((debt.principal - debt.balance) / debt.principal) * 100;

          return (
            <div key={debt.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-red-400" size={20} />
                    <h3 className="font-semibold text-white">{debt.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${debt.status === "paid" ? "bg-green-500/10 text-green-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                      {debt.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1 capitalize">{debt.category}</p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingDebt(debt)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteDebt(debt.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-slate-400 text-sm">Balance</div>
                  <div className="text-lg font-bold text-white">
                    {formatCurrency(debt.balance, "INR")}
                  </div>
                  <div className="text-xs text-slate-400">
                    of {formatCurrency(debt.principal, "INR")} principal
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Interest Rate</div>
                  <div className="text-lg font-bold text-white">
                    {debt.interestRate}%
                  </div>
                  <div className="text-xs text-slate-400">
                    Monthly payment: {formatCurrency(debt.monthlyPayment, "INR")}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Next Payment</div>
                  <div className="text-lg font-bold text-white">
                    {debt.dueDate}{getOrdinalSuffix(debt.dueDate)}
                  </div>
                  <div className="text-xs text-slate-400">
                    of this month
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white font-medium">{progress.toFixed(1)}% paid</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {debt.status !== "paid" && (
                <div className="mt-4 flex gap-2">
                  {[10000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleMakePayment(debt.id, amount)}
                      className="flex-1 px-3 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Pay {formatCurrency(amount, "INR")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {debts.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <TrendingDown className="text-slate-400 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-white mb-2">No Debts Recorded</h3>
          <p className="text-slate-400 mb-4">
            Great job! You don't have any debts recorded. Add a debt to start tracking.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Add Debt
          </button>
        </div>
      )}
    </div>
  );
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}