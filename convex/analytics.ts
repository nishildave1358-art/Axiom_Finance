import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDashboardMetrics = query({
    args: {
        period: v.optional(v.string()), // 'month', 'year', 'all'
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const wallet = await ctx.db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!wallet) return null;

        // Fetch transactions
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
            .order("desc")
            .take(500); // Limit for performance, might need pagination later

        // Fetch predictions (timeline events)
        const timelineEvents = await ctx.db
            .query("timelineEvents")
            .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
            .filter((q) => q.eq(q.field("isProjected"), true))
            .collect();

        // --- Process Data for Charts ---

        // 1. Monthly Trends (Revenue vs Expenses)
        // Group transactions by month
        const monthlyDataMap = new Map<string, { revenue: number; expenses: number; prediction: number }>();

        const getMonthKey = (timestamp: number) => {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g., "Jan 2024" or just "Jan"
        };

        // Sort transactions by date asc for charting
        const sortedTransactions = [...transactions].sort((a, b) => a.date - b.date);

        sortedTransactions.forEach((t) => {
            const key = getMonthKey(t.date);
            if (!monthlyDataMap.has(key)) {
                monthlyDataMap.set(key, { revenue: 0, expenses: 0, prediction: 0 });
            }
            const entry = monthlyDataMap.get(key)!;
            if (t.type === 'income') {
                entry.revenue += t.amount;
            } else if (t.type === 'expense') {
                entry.expenses += t.amount;
            }
        });

        // Merge Predictions
        timelineEvents.forEach((t) => {
            const key = getMonthKey(t.date);
            // Only add if it's in the future relative to now, or if we want to show past predictions vs actuals
            // For now, let's just add them to the map
            if (!monthlyDataMap.has(key)) {
                monthlyDataMap.set(key, { revenue: 0, expenses: 0, prediction: 0 }); // Initialize if empty
            }
            const entry = monthlyDataMap.get(key)!;
            // Assuming predictions track expected balance or revenue? 
            // If timeline event is income, add to prediction revenue? 
            // Let's simplify: Prediction line often tracks 'Projected Revenue' or 'Projected Balance'
            // The original mock had 'prediction' as a single line. Let's make it 'Projected Revenue' for now.
            if (t.type === 'income') {
                entry.prediction += t.amount;
            }
        });

        // Convert Map to Array for Recharts
        // We need a stable sort order (Calendar order)
        const sortedKeys = Array.from(monthlyDataMap.keys()).sort((a, b) => {
            return new Date(a).getTime() - new Date(b).getTime();
        });

        const trendData = sortedKeys.map(key => ({
            name: key.split(' ')[0], // Just "Jan", "Feb"
            ...monthlyDataMap.get(key)!
        }));

        // Fill in missing months if needed? (Skipping for now)

        // 2. Expense Distribution
        const expenseMap = new Map<string, number>();
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || "Uncategorized";
            expenseMap.set(cat, (expenseMap.get(cat) || 0) + t.amount);
        });

        const expenseData = Array.from(expenseMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 categories

        // Assign colors
        const colors = ['#3b82f6', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'];
        const expenseDataWithColor = expenseData.map((item, index) => ({
            ...item,
            color: colors[index % colors.length]
        }));


        // 3. KPI Calculations
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const thisMonthTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            // Simple handle for previous month wrapping
            const lastMonthDate = new Date();
            lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
            return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
        });

        const calcTotal = (txs: typeof transactions, type: string) =>
            txs.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);

        const thisMonthRevenue = calcTotal(thisMonthTransactions, 'income');
        const lastMonthRevenue = calcTotal(lastMonthTransactions, 'income');
        const revenueGrowth = lastMonthRevenue === 0 ? 100 : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

        const thisMonthBurn = calcTotal(thisMonthTransactions, 'expense');
        const lastMonthBurn = calcTotal(lastMonthTransactions, 'expense');
        const burnRateChange = lastMonthBurn === 0 ? 100 : ((thisMonthBurn - lastMonthBurn) / lastMonthBurn) * 100;

        return {
            trendData,
            expenseData: expenseDataWithColor,
            kpis: {
                revenue: {
                    value: thisMonthRevenue,
                    change: revenueGrowth,
                },
                burnRate: {
                    value: thisMonthBurn,
                    change: burnRateChange,
                },
                // Runway is already calculated in wallet summary query, but we can pass it here if needed
            }
        };
    },
});
