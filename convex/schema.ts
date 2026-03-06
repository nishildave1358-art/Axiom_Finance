import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Core wallet state
  wallets: defineTable({
    userId: v.id("users"),
    totalBalance: v.number(),
    availableCash: v.number(),
    lockedTaxReserve: v.number(),
    riskZoneCash: v.number(),
    futureCommittedCash: v.number(),
    currency: v.string(),
    region: v.string(),
    isSimulationActive: v.boolean(),
    simulatedBalance: v.optional(v.number()),
    lastUpdated: v.number(),
  }).index("by_user", ["userId"]),

  // Transaction history
  transactions: defineTable({
    walletId: v.id("wallets"),
    userId: v.id("users"),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    date: v.number(),
    isRecurring: v.boolean(),
    recurringFrequency: v.optional(v.string()),
    nextRecurrence: v.optional(v.number()),
    isSimulated: v.boolean(),
    tags: v.array(v.string()),
  }).index("by_wallet", ["walletId"])
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_recurring", ["isRecurring", "nextRecurrence"]),

  // Tax profiles and settings
  taxProfiles: defineTable({
    userId: v.id("users"),
    region: v.string(),
    taxRate: v.number(),
    reservePercentage: v.number(),
    quarterlyEstimates: v.boolean(),
    nextTaxDate: v.number(),
    customRules: v.array(v.object({
      name: v.string(),
      rate: v.number(),
      threshold: v.number(),
    })),
  }).index("by_user", ["userId"]),

  // Risk and runway calculations
  riskAssessments: defineTable({
    walletId: v.id("wallets"),
    userId: v.id("users"),
    runwayDays: v.number(),
    depletionDate: v.number(),
    riskLevel: v.union(v.literal("healthy"), v.literal("watch"), v.literal("critical")),
    monthlyBurnRate: v.number(),
    safetyThreshold: v.number(),
    calculatedAt: v.number(),
    factors: v.array(v.object({
      type: v.string(),
      impact: v.number(),
      description: v.string(),
    })),
  }).index("by_wallet", ["walletId"])
    .index("by_user", ["userId"]),

  // Simulation sessions
  simulations: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    sessionId: v.string(),
    isActive: v.boolean(),
    startedAt: v.number(),
    originalState: v.object({
      totalBalance: v.number(),
      availableCash: v.number(),
      lockedTaxReserve: v.number(),
      riskZoneCash: v.number(),
      futureCommittedCash: v.number(),
    }),
    simulatedState: v.object({
      totalBalance: v.number(),
      availableCash: v.number(),
      lockedTaxReserve: v.number(),
      riskZoneCash: v.number(),
      futureCommittedCash: v.number(),
    }),
    changes: v.array(v.object({
      type: v.string(),
      description: v.string(),
      impact: v.number(),
      timestamp: v.number(),
    })),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_active", ["isActive"]),

  // Action confirmations and audit log
  actionLogs: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    actionType: v.string(),
    description: v.string(),
    beforeState: v.object({
      totalBalance: v.number(),
      availableCash: v.number(),
      runwayDays: v.number(),
      riskLevel: v.string(),
    }),
    afterState: v.object({
      totalBalance: v.number(),
      availableCash: v.number(),
      runwayDays: v.number(),
      riskLevel: v.string(),
    }),
    confirmed: v.boolean(),
    confirmedAt: v.optional(v.number()),
    ipAddress: v.string(),
    userAgent: v.string(),
  }).index("by_user", ["userId"])
    .index("by_wallet", ["walletId"])
    .index("by_confirmed", ["confirmed"]),

  // Recurring expenses and income
  recurringItems: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    type: v.union(v.literal("income"), v.literal("expense")),
    name: v.string(),
    amount: v.number(),
    frequency: v.union(
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    startDate: v.optional(v.number()),
    nextDate: v.number(),
    endDate: v.optional(v.number()),
    category: v.string(),
    isActive: v.boolean(),
    priority: v.union(v.literal("critical"), v.literal("important"), v.literal("optional")),
  }).index("by_user", ["userId"])
    .index("by_wallet", ["walletId"])
    .index("by_next_date", ["nextDate"])
    .index("by_active", ["isActive"]),

  // Financial timeline events
  timelineEvents: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    date: v.number(),
    type: v.union(
      v.literal("income"),
      v.literal("expense"),
      v.literal("tax_payment"),
      v.literal("milestone"),
      v.literal("depletion_warning")
    ),
    amount: v.number(),
    description: v.string(),
    category: v.string(),
    confidence: v.number(), // 0-1 for prediction confidence
    isProjected: v.boolean(),
  }).index("by_user", ["userId"])
    .index("by_wallet", ["walletId"])
    .index("by_date", ["date"])
    .index("by_type", ["type"]),

  // User preferences and settings
  userSettings: defineTable({
    userId: v.id("users"),
    riskTolerance: v.union(v.literal("conservative"), v.literal("moderate"), v.literal("aggressive")),
    runwayTarget: v.number(), // target days of runway
    currency: v.string(),
    locale: v.string(),
    timezone: v.string(),
    notifications: v.object({
      lowRunway: v.boolean(),
      riskThreshold: v.boolean(),
      taxReminders: v.boolean(),
      weeklyReports: v.boolean(),
    }),
    displayPreferences: v.object({
      showCents: v.boolean(),
      compactView: v.boolean(),
      darkMode: v.boolean(),
    }),
  }).index("by_user", ["userId"]),

  // Budgets
  budgets: defineTable({
    userId: v.id("users"),
    category: v.string(),
    limit: v.number(),
    period: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Financial goals
  goals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    targetDate: v.number(),
    category: v.string(),
    isActive: v.boolean(),
    isCompleted: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Debts
  debts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    currentBalance: v.number(),
    originalBalance: v.number(),
    interestRate: v.number(),
    minimumPayment: v.number(),
    dueDate: v.number(),
    type: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  contactMessages: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    email: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
