import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../lib/utils";
import { 
  Download, 
  Printer, 
  Filter,
  Table,
  PieChart as PieChartIcon
} from "lucide-react";
import { toast } from "sonner";
import { apiJson } from "../lib/api";

type Transaction = {
  id: string;
  userId: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  date: number;
  tags: string[];
  createdAt: number;
};

const mockMetrics = {
  monthlyBurnRate: 350000,
  runwayDays: 73,
  cashFlowScore: 85,
  expenseCategories: [
    { name: "Housing", value: 250000 },
    { name: "Software", value: 45000 },
    { name: "Marketing", value: 120000 },
    { name: "Supplies", value: 30000 },
    { name: "Other", value: 55000 },
  ],
  incomeSources: [
    { name: "Freelance", value: 800000 },
    { name: "Retainer", value: 1500000 },
    { name: "Investments", value: 200000 },
  ],
};

const mockWalletSummary = {
  totalBalance: 4250000,
  availableCash: 2550000,
  lockedTaxReserve: 1062500,
  riskZoneCash: 425000,
  futureCommittedCash: 212500,
  currency: "INR",
  lastUpdated: Date.now(),
};

export function ReportsView() {
  const [reportType, setReportType] = useState("transactions");
  const [dateRange, setDateRange] = useState("month");
  const [viewMode, setViewMode] = useState("table");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const metrics = mockMetrics;
  const walletSummary = mockWalletSummary;

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        setIsLoading(true);
        const data = await apiJson<{ transactions: Transaction[] }>(`/api/transactions?range=${encodeURIComponent(dateRange)}`);
        if (mounted) setTransactions(data.transactions);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load transactions");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dateRange]);

  const filteredTransactions = useMemo(() => transactions, [transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      if (transaction.type === "income") {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpenses += transaction.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpenses: 0 });
  }, [filteredTransactions]);

  const handleExport = () => {
    try {
      if (filteredTransactions.length === 0) {
        toast.error("No transactions to export");
        return;
      }

      const headers = ["date", "type", "description", "category", "amount", "tags"];
      const rows = filteredTransactions.map((t) => [
        new Date(t.date).toISOString(),
        t.type,
        t.description,
        t.category,
        String(t.amount),
        (t.tags || []).join("|"),
      ]);

      const csv = [headers, ...rows]
        .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `axiom-transactions-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("CSV exported");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Financial Reports</h1>
          <p className="text-slate-400 mt-1">Generate and export detailed financial reports</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit">
        <button
          onClick={() => setReportType("transactions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
            reportType === "transactions" 
              ? "bg-primary text-black" 
              : "text-slate-300 hover:text-white"
          }`}
        >
          <Table size={16} />
          Transactions
        </button>
        <button
          onClick={() => setReportType("summary")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
            reportType === "summary" 
              ? "bg-primary text-black" 
              : "text-slate-300 hover:text-white"
          }`}
        >
          <PieChartIcon size={16} />
          Summary
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              viewMode === "table" 
                ? "bg-primary text-black" 
                : "text-slate-300 hover:text-white"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              viewMode === "chart" 
                ? "bg-primary text-black" 
                : "text-slate-300 hover:text-white"
            }`}
          >
            Chart
          </button>
        </div>
      </div>

      {/* Report Content */}
      {reportType === "transactions" && (
        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-slate-400">Loading transactions…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-slate-400 font-normal">Date</th>
                  <th className="text-left p-4 text-slate-400 font-normal">Description</th>
                  <th className="text-left p-4 text-slate-400 font-normal">Category</th>
                  <th className="text-right p-4 text-slate-400 font-normal">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-slate-300">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-white">
                      {transaction.description}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {transaction.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300">
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-medium ${
                      transaction.type === "income" ? "text-green-400" : "text-red-400"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount, "INR")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/10">
                <tr>
                  <td colSpan={3} className="p-4 text-right text-slate-300 font-medium">
                    Total Income:
                  </td>
                  <td className="p-4 text-right text-green-400 font-medium">
                    {formatCurrency(totals.totalIncome, "INR")}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-4 text-right text-slate-300 font-medium">
                    Total Expenses:
                  </td>
                  <td className="p-4 text-right text-red-400 font-medium">
                    {formatCurrency(totals.totalExpenses, "INR")}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-4 text-right text-white font-bold">
                    Net Change:
                  </td>
                  <td className={`p-4 text-right font-bold ${
                    totals.totalIncome - totals.totalExpenses >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {formatCurrency(totals.totalIncome - totals.totalExpenses, "INR")}
                  </td>
                </tr>
              </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {reportType === "summary" && (
        <div className="space-y-6">
          {/* Wallet Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <SummaryCard 
              title="Total Balance" 
              value={formatCurrency(walletSummary.totalBalance, "INR")} 
              icon="💰"
            />
            <SummaryCard 
              title="Available Cash" 
              value={formatCurrency(walletSummary.availableCash, "INR")} 
              icon="💵"
            />
            <SummaryCard 
              title="Tax Reserve" 
              value={formatCurrency(walletSummary.lockedTaxReserve, "INR")} 
              icon="🏦"
            />
            <SummaryCard 
              title="Risk Zone" 
              value={formatCurrency(walletSummary.riskZoneCash, "INR")} 
              icon="⚠️"
            />
            <SummaryCard 
              title="Committed" 
              value={formatCurrency(walletSummary.futureCommittedCash, "INR")} 
              icon="🔒"
            />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard 
              title="Monthly Burn Rate" 
              value={formatCurrency(metrics.monthlyBurnRate, "INR")} 
              description="Average monthly expenses"
            />
            <MetricCard 
              title="Runway (Days)" 
              value={metrics.runwayDays.toString()} 
              description="Days of runway at current burn rate"
            />
            <MetricCard 
              title="Cash Flow Score" 
              value={`${metrics.cashFlowScore}/100`} 
              description="Financial health indicator"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Income Sources</h3>
              <div className="space-y-3">
                {metrics.incomeSources.map((source, index) => (
                  <div key={source.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                      ></div>
                      <span className="text-slate-300">{source.name}</span>
                    </div>
                    <span className="text-white font-medium">
                      {formatCurrency(source.value, "INR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Expense Categories</h3>
              <div className="space-y-3">
                {metrics.expenseCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                      ></div>
                      <span className="text-slate-300">{category.name}</span>
                    </div>
                    <span className="text-white font-medium">
                      {formatCurrency(category.value, "INR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-xl font-bold text-white mt-2">{value}</div>
    </div>
  );
}

function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-slate-400 text-sm">{title}</h3>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      <p className="text-slate-400 text-sm mt-2">{description}</p>
    </div>
  );
}

const INCOME_COLORS = ['#10B981', '#3B82F6', '#8B5CF6'];
const EXPENSE_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];