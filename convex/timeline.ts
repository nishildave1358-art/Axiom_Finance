import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate financial timeline for next 12 months
export const getFinancialTimeline = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) return null;

    const months = args.months || 12;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // Get recurring items
    const recurringItems = await ctx.db
      .query("recurringItems")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get existing timeline events
    const existingEvents = await ctx.db
      .query("timelineEvents")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .filter((q) => q.gte(q.field("date"), startDate.getTime()))
      .filter((q) => q.lte(q.field("date"), endDate.getTime()))
      .collect();

    // Generate projected events from recurring items
    const projectedEvents = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      for (const item of recurringItems) {
        const itemNextDate = new Date(item.nextDate);
        
        if (itemNextDate.getTime() === currentDate.getTime()) {
          projectedEvents.push({
            date: currentDate.getTime(),
            type: item.type,
            amount: item.amount,
            description: item.name,
            category: item.category,
            confidence: 0.9, // High confidence for recurring items
            isProjected: true,
            priority: item.priority,
            recurringId: item._id,
          });

          // Calculate next occurrence
          const nextOccurrence = new Date(itemNextDate);
          switch (item.frequency) {
            case "weekly":
              nextOccurrence.setDate(nextOccurrence.getDate() + 7);
              break;
            case "biweekly":
              nextOccurrence.setDate(nextOccurrence.getDate() + 14);
              break;
            case "monthly":
              nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
              break;
            case "quarterly":
              nextOccurrence.setMonth(nextOccurrence.getMonth() + 3);
              break;
            case "yearly":
              nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
              break;
          }

          // Note: In a real implementation, you'd want to update the next date
          // but since this is a query, we can't modify data here
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate running balance
    let runningBalance = wallet.isSimulationActive 
      ? (wallet.simulatedBalance || wallet.totalBalance)
      : wallet.totalBalance;

    const timelineWithBalance = [];
    const allEvents = [...existingEvents, ...projectedEvents]
      .sort((a, b) => a.date - b.date);

    // Add current balance as starting point
    timelineWithBalance.push({
      date: startDate.getTime(),
      type: "milestone",
      amount: 0,
      description: "Current Balance",
      category: "milestone",
      confidence: 1.0,
      isProjected: false,
      balance: runningBalance,
      balanceChange: 0,
    });

    for (const event of allEvents) {
      const balanceChange = event.type === "income" ? event.amount : -event.amount;
      runningBalance += balanceChange;

      timelineWithBalance.push({
        ...event,
        balance: runningBalance,
        balanceChange,
        riskLevel: runningBalance < wallet.totalBalance * 0.2 ? "critical" :
                  runningBalance < wallet.totalBalance * 0.5 ? "watch" : "healthy",
      });

      // Add depletion warning if balance gets too low
      if (runningBalance <= 0 && !timelineWithBalance.some(e => e.type === "depletion_warning")) {
        timelineWithBalance.push({
          date: event.date,
          type: "depletion_warning",
          amount: 0,
          description: "Funds Depleted",
          category: "warning",
          confidence: 0.8,
          isProjected: true,
          balance: 0,
          balanceChange: 0,
          riskLevel: "critical",
        });
      }
    }

    // Group events by month for easier display
    const monthlyGroups: Record<string, {
      year: number;
      month: number;
      monthName: string;
      events: any[];
      totalIncome: number;
      totalExpenses: number;
      netChange: number;
      endBalance: number;
    }> = {};
    for (const event of timelineWithBalance) {
      const eventDate = new Date(event.date);
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          year: eventDate.getFullYear(),
          month: eventDate.getMonth(),
          monthName: eventDate.toLocaleString('default', { month: 'long' }),
          events: [],
          totalIncome: 0,
          totalExpenses: 0,
          netChange: 0,
          endBalance: 0,
        };
      }

      monthlyGroups[monthKey].events.push(event);
      
      if (event.type === "income") {
        monthlyGroups[monthKey].totalIncome += event.amount;
      } else if (event.type === "expense") {
        monthlyGroups[monthKey].totalExpenses += event.amount;
      }
      
      monthlyGroups[monthKey].netChange += event.balanceChange;
      monthlyGroups[monthKey].endBalance = event.balance;
    }

    return {
      timeline: timelineWithBalance,
      monthlyGroups: Object.values(monthlyGroups),
      summary: {
        startBalance: wallet.totalBalance,
        projectedEndBalance: runningBalance,
        totalProjectedIncome: projectedEvents
          .filter(e => e.type === "income")
          .reduce((sum, e) => sum + e.amount, 0),
        totalProjectedExpenses: projectedEvents
          .filter(e => e.type === "expense")
          .reduce((sum, e) => sum + e.amount, 0),
        depletionDate: timelineWithBalance.find(e => e.type === "depletion_warning")?.date,
        riskPeriods: timelineWithBalance.filter(e => e.riskLevel === "critical").length,
      },
    };
  },
});

// Add a one-time event to the timeline
export const addTimelineEvent = mutation({
  args: {
    date: v.number(),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("milestone")),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) throw new Error("Wallet not found");

    const eventId = await ctx.db.insert("timelineEvents", {
      userId,
      walletId: wallet._id,
      date: args.date,
      type: args.type,
      amount: args.amount,
      description: args.description,
      category: args.category,
      confidence: 1.0, // User-added events have full confidence
      isProjected: false,
    });

    return eventId;
  },
});

// Get critical dates and milestones
export const getCriticalDates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) return null;

    const taxProfile = await ctx.db
      .query("taxProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const riskAssessment = await ctx.db
      .query("riskAssessments")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .first();

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    const criticalDates = [];

    // Tax payment date
    if (taxProfile?.nextTaxDate) {
      const daysUntilTax = Math.ceil((taxProfile.nextTaxDate - now) / (24 * 60 * 60 * 1000));
      criticalDates.push({
        date: taxProfile.nextTaxDate,
        type: "tax_payment",
        description: `${taxProfile.region} Tax Payment Due`,
        daysUntil: daysUntilTax,
        priority: daysUntilTax <= 30 ? "critical" : "important",
        amount: wallet.lockedTaxReserve,
      });
    }

    // Runway depletion
    if (riskAssessment?.depletionDate && riskAssessment.depletionDate > now) {
      const daysUntilDepletion = Math.ceil((riskAssessment.depletionDate - now) / (24 * 60 * 60 * 1000));
      criticalDates.push({
        date: riskAssessment.depletionDate,
        type: "depletion_warning",
        description: "Projected Fund Depletion",
        daysUntil: daysUntilDepletion,
        priority: daysUntilDepletion <= 30 ? "critical" : 
                 daysUntilDepletion <= 90 ? "important" : "watch",
        amount: 0,
      });
    }

    // Upcoming recurring expenses (next 30 days)
    const upcomingRecurring = await ctx.db
      .query("recurringItems")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.lte(q.field("nextDate"), now + thirtyDays))
      .collect();

    for (const item of upcomingRecurring) {
      const daysUntil = Math.ceil((item.nextDate - now) / (24 * 60 * 60 * 1000));
      criticalDates.push({
        date: item.nextDate,
        type: item.type,
        description: item.name,
        daysUntil,
        priority: item.priority,
        amount: item.amount,
        category: item.category,
      });
    }

    // Sort by date
    criticalDates.sort((a, b) => a.date - b.date);

    return {
      criticalDates,
      summary: {
        criticalCount: criticalDates.filter(d => d.priority === "critical").length,
        importantCount: criticalDates.filter(d => d.priority === "important").length,
        nextCriticalDate: criticalDates.find(d => d.priority === "critical")?.date,
        totalUpcomingExpenses: criticalDates
          .filter(d => d.type === "expense")
          .reduce((sum, d) => sum + d.amount, 0),
      },
    };
  },
});
