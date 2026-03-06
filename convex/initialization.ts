import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Initialize a demo wallet with sample data for new users
export const initializeDemoWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if wallet already exists
    const existingWallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingWallet) {
      return { success: false, message: "Wallet already exists" };
    }

    // Create demo wallet with ₹40,00,000 starting balance
    const initialBalance = 4000000;
    const walletId = await ctx.db.insert("wallets", {
      userId,
      totalBalance: initialBalance,
      availableCash: initialBalance * 0.6, // ₹24,00,000 available
      lockedTaxReserve: initialBalance * 0.25, // ₹10,00,000 for taxes
      riskZoneCash: initialBalance * 0.1, // ₹4,00,000 risk zone
      futureCommittedCash: initialBalance * 0.05, // ₹2,00,000 committed
      currency: "INR",
      region: "IN",
      isSimulationActive: false,
      lastUpdated: Date.now(),
    });

    // Create tax profile
    await ctx.db.insert("taxProfiles", {
      userId,
      region: "IN",
      taxRate: 0.25,
      reservePercentage: 0.25,
      quarterlyEstimates: true,
      nextTaxDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
      customRules: [],
    });

    // Create some sample recurring items
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    // Monthly salary
    await ctx.db.insert("recurringItems", {
      userId,
      walletId,
      type: "income",
      name: "Freelance Income",
      amount: 640000,
      frequency: "monthly",
      startDate: now,
      nextDate: now + oneMonth,
      category: "salary",
      isActive: true,
      priority: "critical",
    });

    // Monthly rent
    await ctx.db.insert("recurringItems", {
      userId,
      walletId,
      type: "expense",
      name: "Office Rent",
      amount: 200000,
      frequency: "monthly",
      startDate: now,
      nextDate: now + oneMonth,
      category: "housing",
      isActive: true,
      priority: "critical",
    });

    // Weekly groceries
    await ctx.db.insert("recurringItems", {
      userId,
      walletId,
      type: "expense",
      name: "Business Supplies",
      amount: 24000,
      frequency: "weekly",
      startDate: now,
      nextDate: now + oneWeek,
      category: "supplies",
      isActive: true,
      priority: "important",
    });

    // Monthly software subscriptions
    await ctx.db.insert("recurringItems", {
      userId,
      walletId,
      type: "expense",
      name: "Software Subscriptions",
      amount: 450,
      frequency: "monthly",
      startDate: now,
      nextDate: now + oneMonth,
      category: "software",
      isActive: true,
      priority: "important",
    });

    // Create initial risk assessment
    const monthlyBurn = 2500 + (300 * 4.33) + 450; // Rent + weekly supplies + software
    const runwayDays = Math.floor((initialBalance * 0.6) / (monthlyBurn / 30));

    await ctx.db.insert("riskAssessments", {
      walletId,
      userId,
      runwayDays,
      depletionDate: now + runwayDays * 24 * 60 * 60 * 1000,
      riskLevel: runwayDays > 90 ? "healthy" : runwayDays > 30 ? "watch" : "critical",
      monthlyBurnRate: monthlyBurn,
      safetyThreshold: initialBalance * 0.2,
      calculatedAt: now,
      factors: [
        {
          type: "tax_reserve",
          impact: initialBalance * 0.25,
          description: "25% reserved for taxes",
        },
        {
          type: "recurring_expenses",
          impact: monthlyBurn,
          description: "Monthly recurring expenses",
        },
      ],
    });

    // Create user settings
    await ctx.db.insert("userSettings", {
      userId,
      riskTolerance: "moderate",
      runwayTarget: 90,
      currency: "USD",
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

    // Add some sample transactions
    await ctx.db.insert("transactions", {
      walletId,
      userId,
      type: "income",
      amount: 8000,
      description: "Initial Freelance Payment",
      category: "salary",
      date: now - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      isRecurring: false,
      isSimulated: false,
      tags: ["initial", "freelance"],
    });

    await ctx.db.insert("transactions", {
      walletId,
      userId,
      type: "expense",
      amount: 2500,
      description: "Office Rent Payment",
      category: "housing",
      date: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      isRecurring: false,
      isSimulated: false,
      tags: ["rent", "office"],
    });

    return {
      success: true,
      walletId,
      message: "Demo wallet initialized successfully with sample data",
    };
  },
});

// Quick setup for users who want to start with their own data
export const quickSetup = mutation({
  args: {
    initialBalance: v.number(),
    monthlyIncome: v.number(),
    monthlyExpenses: v.number(),
    currency: v.optional(v.string()),
    region: v.optional(v.string()),
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
      return { success: false, message: "Wallet already exists" };
    }

    const currency = args.currency || "USD";
    const region = args.region || "US";
    const taxRate = 0.25; // Default 25%

    // Calculate initial bucket allocation
    const taxReserve = args.initialBalance * taxRate;
    const safetyBuffer = args.initialBalance * 0.1;
    const futureCommitted = args.monthlyExpenses;
    const available = Math.max(0, args.initialBalance - taxReserve - safetyBuffer - futureCommitted);

    const walletId = await ctx.db.insert("wallets", {
      userId,
      totalBalance: args.initialBalance,
      availableCash: available,
      lockedTaxReserve: taxReserve,
      riskZoneCash: safetyBuffer,
      futureCommittedCash: futureCommitted,
      currency,
      region,
      isSimulationActive: false,
      lastUpdated: Date.now(),
    });

    // Create tax profile
    await ctx.db.insert("taxProfiles", {
      userId,
      region,
      taxRate,
      reservePercentage: taxRate,
      quarterlyEstimates: false,
      nextTaxDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
      customRules: [],
    });

    // Calculate runway
    const runwayDays = available > 0 && args.monthlyExpenses > 0 
      ? Math.floor((available / args.monthlyExpenses) * 30)
      : available > 0 ? 365 : 0;

    // Create risk assessment
    await ctx.db.insert("riskAssessments", {
      walletId,
      userId,
      runwayDays,
      depletionDate: Date.now() + runwayDays * 24 * 60 * 60 * 1000,
      riskLevel: runwayDays > 90 ? "healthy" : runwayDays > 30 ? "watch" : "critical",
      monthlyBurnRate: args.monthlyExpenses,
      safetyThreshold: safetyBuffer,
      calculatedAt: Date.now(),
      factors: [
        {
          type: "tax_reserve",
          impact: taxReserve,
          description: `${taxRate * 100}% reserved for taxes`,
        },
        {
          type: "monthly_expenses",
          impact: args.monthlyExpenses,
          description: "Estimated monthly expenses",
        },
      ],
    });

    // Create user settings
    await ctx.db.insert("userSettings", {
      userId,
      riskTolerance: "moderate",
      runwayTarget: 90,
      currency,
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

    return {
      success: true,
      walletId,
      runwayDays,
      riskLevel: runwayDays > 90 ? "healthy" : runwayDays > 30 ? "watch" : "critical",
      message: "Wallet setup completed successfully",
    };
  },
});
