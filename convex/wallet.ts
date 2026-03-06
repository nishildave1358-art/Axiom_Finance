import { query, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function nextOccurrence(dateMs: number, frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly") {
  const d = new Date(dateMs);
  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.getTime();
}

// Get wallet summary for the dock
export const getWalletSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) return null;

    const riskAssessment = await ctx.db
      .query("riskAssessments")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .first();

    return {
      totalBalance: wallet.totalBalance,
      availableCash: wallet.availableCash,
      lockedTaxReserve: wallet.lockedTaxReserve,
      riskZoneCash: wallet.riskZoneCash,
      futureCommittedCash: wallet.futureCommittedCash,
      currency: wallet.currency,
      runwayDays: riskAssessment?.runwayDays || 0,
      riskLevel: riskAssessment?.riskLevel || "healthy",
      depletionDate: riskAssessment?.depletionDate,
      isSimulationActive: wallet.isSimulationActive,
      simulatedBalance: wallet.simulatedBalance,
      lastUpdated: wallet.lastUpdated,
    };
  },
});

// Get detailed wallet breakdown
export const getWalletDetails = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) return null;

    const riskAssessment = await ctx.db
      .query("riskAssessments")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .first();

    const taxProfile = await ctx.db
      .query("taxProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const recurringItems = await ctx.db
      .query("recurringItems")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const recentTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .take(10);

    return {
      wallet,
      riskAssessment,
      taxProfile,
      recurringItems,
      recentTransactions,
      buckets: {
        available: {
          amount: wallet.availableCash,
          description: "Safe to spend today without affecting runway or tax obligations",
          color: "green",
        },
        taxReserve: {
          amount: wallet.lockedTaxReserve,
          description: `Locked for ${taxProfile?.region || "tax"} obligations (${taxProfile?.taxRate || 25}% rate)`,
          color: "blue",
          lockReason: "Tax obligations",
        },
        riskZone: {
          amount: wallet.riskZoneCash,
          description: "Spending this money would violate safety thresholds",
          color: "amber",
          lockReason: "Risk threshold protection",
        },
        futureCommitted: {
          amount: wallet.futureCommittedCash,
          description: "Reserved for upcoming recurring expenses",
          color: "purple",
          lockReason: "Future commitments",
        },
      },
    };
  },
});

// Initialize wallet for new user
export const initializeWallet = mutation({
  args: {
    initialBalance: v.number(),
    currency: v.string(),
    region: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if wallet already exists
    const existingWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingWallet) {
      throw new Error("Wallet already exists");
    }

    // Create wallet
    const walletId = await ctx.db.insert("wallets", {
      userId,
      totalBalance: args.initialBalance,
      availableCash: args.initialBalance * 0.7, // Conservative initial allocation
      lockedTaxReserve: args.initialBalance * 0.25,
      riskZoneCash: args.initialBalance * 0.05,
      futureCommittedCash: 0,
      currency: args.currency,
      region: args.region,
      isSimulationActive: false,
      lastUpdated: Date.now(),
    });

    // Create initial tax profile
    await ctx.db.insert("taxProfiles", {
      userId,
      region: args.region,
      taxRate: 0.25, // Default 25%
      reservePercentage: 0.25,
      quarterlyEstimates: false,
      nextTaxDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
      customRules: [],
    });

    // Create initial risk assessment
    await ctx.db.insert("riskAssessments", {
      walletId,
      userId,
      runwayDays: 90, // Conservative estimate
      depletionDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
      riskLevel: "healthy",
      monthlyBurnRate: 0,
      safetyThreshold: args.initialBalance * 0.2,
      calculatedAt: Date.now(),
      factors: [],
    });

    // Create user settings
    await ctx.db.insert("userSettings", {
      userId,
      riskTolerance: "moderate",
      runwayTarget: 90,
      currency: args.currency,
      locale: "en-US",
      timezone: "UTC",
      notifications: {
        lowRunway: true,
        riskThreshold: true,
        taxReminders: true,
        weeklyReports: false,
      },
      displayPreferences: {
        showCents: true,
        compactView: false,
        darkMode: false,
      },
    });

    return walletId;
  },
});

// Update wallet balance (recalculates all buckets)
// Internal helper for updating balance
async function internalUpdateBalance(ctx: MutationCtx, args: { newBalance: number, reason: string }) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const wallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!wallet) throw new Error("Wallet not found");

  const taxProfile = await ctx.db
    .query("taxProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  // Recalculate buckets based on new balance
  const taxReserve = args.newBalance * (taxProfile?.reservePercentage || 0.25);

  // Get upcoming recurring expenses for next 30 days
  const recurringExpenses = await ctx.db
    .query("recurringItems")
    .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
    .filter((q) => q.eq(q.field("isActive"), true))
    .filter((q) => q.eq(q.field("type"), "expense"))
    .collect();

  const now = Date.now();
  const windowEnd = now + 30 * 24 * 60 * 60 * 1000;

  const futureCommitted = recurringExpenses.reduce((sum, item) => {
    let occurrence = item.nextDate;
    let guard = 0;

    while (occurrence <= windowEnd && guard < 120) {
      guard++;

      if (occurrence >= now) {
        if (item.endDate !== undefined && occurrence > item.endDate) break;
        sum += item.amount;
      }

      occurrence = nextOccurrence(occurrence, item.frequency);
    }

    return sum;
  }, 0);

  const safetyBuffer = args.newBalance * 0.1; // 10% safety buffer
  const lockedAmount = taxReserve + futureCommitted;
  const availableBeforeSafety = args.newBalance - lockedAmount;
  const riskZone = Math.max(0, Math.min(safetyBuffer, availableBeforeSafety * 0.2));
  const available = Math.max(0, availableBeforeSafety - riskZone);

  // Update wallet
  await ctx.db.patch(wallet._id, {
    totalBalance: args.newBalance,
    availableCash: available,
    lockedTaxReserve: taxReserve,
    riskZoneCash: riskZone,
    futureCommittedCash: futureCommitted,
    lastUpdated: Date.now(),
  });

  // Recalculate risk assessment
  const monthlyBurn = futureCommitted;
  const runwayDays = available > 0 && monthlyBurn > 0
    ? Math.floor((available / monthlyBurn) * 30)
    : available > 0 ? 365 : 0;

  let riskLevel: "healthy" | "watch" | "critical" = "healthy";
  if (runwayDays < 30) riskLevel = "critical";
  else if (runwayDays < 90) riskLevel = "watch";

  await ctx.db.insert("riskAssessments", {
    walletId: wallet._id,
    userId,
    runwayDays,
    depletionDate: Date.now() + runwayDays * 24 * 60 * 60 * 1000,
    riskLevel,
    monthlyBurnRate: monthlyBurn,
    safetyThreshold: safetyBuffer,
    calculatedAt: Date.now(),
    factors: [
      {
        type: "tax_reserve",
        impact: taxReserve,
        description: `${(taxProfile?.reservePercentage || 0.25) * 100}% reserved for taxes`,
      },
      {
        type: "recurring_expenses",
        impact: futureCommitted,
        description: `Next 30 days recurring expenses: ${recurringExpenses.length} items`,
      },
      {
        type: "safety_buffer",
        impact: riskZone,
        description: "Risk zone protection buffer",
      },
    ],
  });

  // Log the action
  await ctx.db.insert("actionLogs", {
    userId,
    walletId: wallet._id,
    actionType: "balance_update",
    description: `Balance updated: ${args.reason}`,
    beforeState: {
      totalBalance: wallet.totalBalance,
      availableCash: wallet.availableCash,
      runwayDays: 0, // Will be filled by previous assessment
      riskLevel: "unknown",
    },
    afterState: {
      totalBalance: args.newBalance,
      availableCash: available,
      runwayDays,
      riskLevel,
    },
    confirmed: true,
    confirmedAt: Date.now(),
    ipAddress: "system",
    userAgent: "system",
  });

  return {
    success: true,
    newState: {
      totalBalance: args.newBalance,
      availableCash: available,
      runwayDays,
      riskLevel,
    },
  };
}

// Update wallet balance (recalculates all buckets)
export const updateBalance = mutation({
  args: {
    newBalance: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return await internalUpdateBalance(ctx, args);
  },
});

// Add a transaction
export const addTransaction = mutation({
  args: {
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) throw new Error("Wallet not found");

    // Add transaction
    await ctx.db.insert("transactions", {
      walletId: wallet._id,
      userId,
      type: args.type,
      amount: args.amount,
      description: args.description,
      category: args.category,
      date: args.date,
      isRecurring: false,
      isSimulated: wallet.isSimulationActive,
      tags: [],
    });

    // Update wallet balance
    const newBalance = args.type === "income"
      ? wallet.totalBalance + args.amount
      : wallet.totalBalance - args.amount;

    await internalUpdateBalance(ctx, {
      newBalance,
      reason: `Transaction: ${args.description}`,
    });

    return { success: true };
  },
});

// Add a recurring item
export const addRecurringItem = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    frequency: v.union(
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    category: v.string(),
    priority: v.union(v.literal("critical"), v.literal("important"), v.literal("optional")),
    startDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) throw new Error("Wallet not found");

    // Calculate next date based on frequency
    let nextDate = args.startDate;
    const now = Date.now();
    while (nextDate < now) {
      switch (args.frequency) {
        case "weekly":
          nextDate += 7 * 24 * 60 * 60 * 1000;
          break;
        case "biweekly":
          nextDate += 14 * 24 * 60 * 60 * 1000;
          break;
        case "monthly":
          nextDate += 30 * 24 * 60 * 60 * 1000;
          break;
        case "quarterly":
          nextDate += 90 * 24 * 60 * 60 * 1000;
          break;
        case "yearly":
          nextDate += 365 * 24 * 60 * 60 * 1000;
          break;
        default:
          nextDate += 30 * 24 * 60 * 60 * 1000;
      }
    }

    await ctx.db.insert("recurringItems", {
      walletId: wallet._id,
      userId,
      name: args.name,
      type: args.type,
      amount: args.amount,
      frequency: args.frequency,
      category: args.category,
      priority: args.priority,
      startDate: args.startDate,
      nextDate,
      isActive: true,
    });

    // Recalculate wallet buckets
    await internalUpdateBalance(ctx, {
      newBalance: wallet.totalBalance,
      reason: `Added recurring item: ${args.name}`,
    });

    return { success: true };
  },
});

// Get transactions
export const getTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .take(args.limit || 100);
  },
});

// Budget management
export const getBudgets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const addBudget = mutation({
  args: {
    category: v.string(),
    limit: v.number(),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("budgets", {
      userId,
      category: args.category,
      limit: args.limit,
      period: args.period,
      isActive: true,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Goal management
export const getGoals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const addGoal = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    targetDate: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("goals", {
      userId,
      name: args.name,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      targetDate: args.targetDate,
      category: args.category,
      isActive: true,
      isCompleted: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateGoal = mutation({
  args: {
    goalId: v.id("goals"),
    contribution: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) throw new Error("Goal not found");

    const newAmount = goal.currentAmount + args.contribution;
    const isCompleted = newAmount >= goal.targetAmount;

    await ctx.db.patch(args.goalId, {
      currentAmount: newAmount,
      isCompleted,
    });

    return { success: true };
  },
});

// Debt management
export const getDebts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("debts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gt(q.field("currentBalance"), 0))
      .collect();
  },
});

export const addDebt = mutation({
  args: {
    name: v.string(),
    currentBalance: v.number(),
    interestRate: v.number(),
    minimumPayment: v.number(),
    dueDate: v.number(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("debts", {
      userId,
      name: args.name,
      currentBalance: args.currentBalance,
      originalBalance: args.currentBalance,
      interestRate: args.interestRate,
      minimumPayment: args.minimumPayment,
      dueDate: args.dueDate,
      type: args.type,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const makeDebtPayment = mutation({
  args: {
    debtId: v.id("debts"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== userId) throw new Error("Debt not found");

    const newBalance = Math.max(0, debt.currentBalance - args.amount);

    await ctx.db.patch(args.debtId, {
      currentBalance: newBalance,
    });

    // Record payment as transaction
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (wallet) {
      await ctx.db.insert("transactions", {
        walletId: wallet._id,
        userId,
        type: "expense",
        amount: args.amount,
        description: `Debt payment: ${debt.name}`,
        category: "debt",
        date: Date.now(),
        isRecurring: false,
        isSimulated: false,
        tags: ["debt-payment"],
      });

      // Update wallet balance
      await internalUpdateBalance(ctx, {
        newBalance: wallet.totalBalance - args.amount,
        reason: `Debt payment: ${debt.name}`,
      });
    }

    return { success: true };
  },
});
