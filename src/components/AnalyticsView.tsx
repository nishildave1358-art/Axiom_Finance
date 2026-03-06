import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "../lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { apiJson } from "../lib/api";
import { toast } from "sonner";

type AnalyticsMetrics = {
  monthlyBurnRate: number;
  runwayDays: number;
  cashFlowScore: number;
  expenseCategories: { name: string; value: number }[];
  incomeSources: { name: string; value: number }[];
  trendData: { month: string; balance: number; income: number; expenses: number }[];
};

export function AnalyticsView() {
  const [period, setPeriod] = useState("month");
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const data = await apiJson<{ analytics: AnalyticsMetrics }>("/api/dashboard");
        if (!mounted) return;
        setMetrics(data.analytics);
        setError(null);
        hasLoadedRef.current = true;
      } catch (e: any) {
        if (!hasLoadedRef.current) {
          setError(e?.message || "Failed to load analytics");
        }
        toast.error(e?.message || "Failed to load analytics");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void poll();
    const intervalId: number = window.setInterval(() => {
      void poll();
    }, 6000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  const trendData = metrics?.trendData ?? [];
  const expenseData = useMemo(() => {
    return (metrics?.expenseCategories ?? []).map((x) => ({ name: x.name, value: x.value }));
  }, [metrics]);

  const kpis = useMemo(() => {
    if (!metrics) return null;
    const last = metrics.trendData[metrics.trendData.length - 1];
    const prev = metrics.trendData[metrics.trendData.length - 2];
    const growth = (curr: number, prior: number) => {
      if (!Number.isFinite(curr) || !Number.isFinite(prior) || prior === 0) return 0;
      return ((curr - prior) / prior) * 100;
    };

    const incomeGrowth = last && prev ? growth(last.income, prev.income) : 0;
    const expenseGrowth = last && prev ? growth(last.expenses, prev.expenses) : 0;

    return {
      monthlyBurnRate: metrics.monthlyBurnRate,
      runwayDays: metrics.runwayDays,
      cashFlowScore: metrics.cashFlowScore,
      incomeGrowth,
      expenseGrowth,
      netGrowth: last ? last.income - last.expenses : 0,
    };
  }, [metrics]);

  if (isLoading || !metrics || !kpis) {
    if (!isLoading && error) {
      return (
        <div className="space-y-6 p-4 sm:p-6 pb-20">
          <div className="glass-card rounded-xl p-6">
            <div className="text-white font-bold">Analytics unavailable</div>
            <div className="text-slate-400 mt-2">{error}</div>
            <button
              type="button"
              className="mt-4 btn-secondary"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setRefreshKey((k) => k + 1);
              }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6 p-4 sm:p-6 pb-20">
        <div className="text-slate-400">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1">Track your financial performance and trends</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Monthly Burn Rate" 
          value={formatCurrency(kpis.monthlyBurnRate, "INR")} 
          change={kpis.expenseGrowth}
          icon={<TrendingDown className="text-red-400" size={20} />}
          description="vs last period"
        />
        <KPICard 
          title="Runway (Days)" 
          value={kpis.runwayDays.toString()} 
          change={5}
          icon={<TrendingUp className="text-green-400" size={20} />}
          description="days of runway"
        />
        <KPICard 
          title="Cash Flow Score" 
          value={`${kpis.cashFlowScore}/100`} 
          change={3.2}
          icon={<TrendingUp className="text-green-400" size={20} />}
          description="financial health score"
        />
        <KPICard 
          title="Net Growth" 
          value={formatCurrency(kpis.netGrowth, "INR")} 
          change={kpis.incomeGrowth}
          icon={<TrendingUp className="text-green-400" size={20} />}
          description="net positive cash flow"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Trend Chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Balance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                formatter={(value) => [formatCurrency(Number(value), "INR"), 'Amount']}
                labelStyle={{ color: '#1F2937' }}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(((percent ?? 0) * 100)).toFixed(0)}%`}
              >
                {expenseData.map((entry, index) => (
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
      </div>

      {/* Income vs Expenses */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`} />
            <Tooltip 
              formatter={(value) => [formatCurrency(Number(value), "INR"), 'Amount']}
              labelStyle={{ color: '#1F2937' }}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            />
            <Bar dataKey="income" fill="#10B981" name="Income" />
            <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, icon, description }: { 
  title: string; 
  value: string; 
  change: number; 
  icon: React.ReactNode;
  description: string;
}) {
  const isPositive = change >= 0;
  
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {icon}
        </div>
      </div>
      <div className={`flex items-center mt-3 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span className="ml-1">{Math.abs(change)}%</span>
        <span className="text-slate-400 ml-1">{description}</span>
      </div>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];