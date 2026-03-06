import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function addDays(ts: number, days: number) {
  return ts + days * 24 * 60 * 60 * 1000;
}

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

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString()}`;
  }
}

function formatDays(days: number) {
  if (!Number.isFinite(days) || days <= 0) return "0 days";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function formatDate(dateMs: number) {
  return new Date(dateMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeCommitmentsInWindow(args: {
  now: number;
  windowEnd: number;
  recurringItems: Array<{
    type: "income" | "expense";
    amount: number;
    nextDate: number;
    frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
    isActive: boolean;
    endDate?: number;
    priority: "critical" | "important" | "optional";
    name: string;
  }>;
}) {
  const expensesByPriority = {
    critical: 0,
    important: 0,
    optional: 0,
  };
  let expenseTotal = 0;
  let incomeTotal = 0;
  const itemsDueSoon: Array<{
    name: string;
    type: "income" | "expense";
    amount: number;
    date: number;
    priority: "critical" | "important" | "optional";
  }> = [];

  for (const item of args.recurringItems) {
    if (!item.isActive) continue;

    let occurrence = item.nextDate;
    let guard = 0;
    while (occurrence <= args.windowEnd && guard < 120) {
      guard++;
      if (occurrence >= args.now) {
        if (item.endDate !== undefined && occurrence > item.endDate) break;

        if (item.type === "expense") {
          expenseTotal += item.amount;
          expensesByPriority[item.priority] += item.amount;
        } else {
          incomeTotal += item.amount;
        }

        itemsDueSoon.push({
          name: item.name,
          type: item.type,
          amount: item.amount,
          date: occurrence,
          priority: item.priority,
        });
      }

      occurrence = nextOccurrence(occurrence, item.frequency);
    }
  }

  itemsDueSoon.sort((a, b) => a.date - b.date);

  return {
    expenseTotal,
    incomeTotal,
    expensesByPriority,
    itemsDueSoon: itemsDueSoon.slice(0, 6),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreToGrade(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export const getEarlyWarnings = query({
  args: {
    horizonDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) return [];

    const riskAssessment = await ctx.db
      .query("riskAssessments")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .first();

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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

    const now = Date.now();
    const horizonDays = Math.max(7, Math.min(args.horizonDays ?? 45, 180));
    const windowEnd = addDays(now, horizonDays);

    const commitments = computeCommitmentsInWindow({
      now,
      windowEnd,
      recurringItems: recurringItems.map((r) => ({
        type: r.type,
        amount: r.amount,
        nextDate: r.nextDate,
        frequency: r.frequency,
        isActive: r.isActive,
        endDate: r.endDate,
        priority: r.priority,
        name: r.name,
      })),
    });

    const runwayTargetDays = settings?.runwayTarget ?? 90;

    const monthlyBurn = riskAssessment?.monthlyBurnRate ?? 0;
    const runwayDays = riskAssessment?.runwayDays ?? 0;

    const alerts: Array<{
      id: string;
      severity: "watch" | "critical";
      title: string;
      message: string;
      suggestions: string[];
      factors: Array<{ label: string; value: string }>;
    }> = [];

    if (runwayDays > 0 && runwayDays < runwayTargetDays) {
      const severity = runwayDays < Math.min(30, runwayTargetDays) ? "critical" : "watch";
      alerts.push({
        id: `runway_${runwayDays}`,
        severity,
        title: severity === "critical" ? "Runway is critically low" : "Runway below your target",
        message:
          severity === "critical"
            ? `At the current burn rate, you may run out of cash in ${formatDays(runwayDays)}.`
            : `Your runway is ${formatDays(runwayDays)}, below your target of ${formatDays(runwayTargetDays)}.`,
        suggestions: [
          "Reduce non-essential recurring expenses for the next 30 days",
          "Pull forward invoices or add a short-term income milestone",
          "Increase your safety buffer (settings) until runway stabilizes",
        ],
        factors: [
          { label: "Runway", value: formatDays(runwayDays) },
          { label: "Monthly burn", value: formatCurrency(monthlyBurn, wallet.currency) },
        ],
      });
    }

    if (commitments.expensesByPriority.critical > 0 && wallet.availableCash < commitments.expensesByPriority.critical) {
      alerts.push({
        id: `commitments_critical_${Math.round(commitments.expensesByPriority.critical)}`,
        severity: "critical",
        title: "Critical commitments exceed available cash",
        message: `Over the next ${horizonDays} days, you have about ${formatCurrency(commitments.expensesByPriority.critical, wallet.currency)} in critical commitments, but only ${formatCurrency(wallet.availableCash, wallet.currency)} available.`,
        suggestions: [
          "Delay optional purchases until after your next income event",
          "Move a due date, split a payment, or negotiate terms for one commitment",
          "Add a short-term income event (invoice, advance, or part payment)",
        ],
        factors: [
          { label: "Critical commitments", value: formatCurrency(commitments.expensesByPriority.critical, wallet.currency) },
          { label: "Available cash", value: formatCurrency(wallet.availableCash, wallet.currency) },
        ],
      });
    }

    if (taxProfile?.nextTaxDate && taxProfile.nextTaxDate <= windowEnd) {
      const daysUntilTax = Math.ceil((taxProfile.nextTaxDate - now) / (24 * 60 * 60 * 1000));
      const severity = daysUntilTax <= 14 ? "critical" : "watch";
      alerts.push({
        id: `tax_${taxProfile.nextTaxDate}`,
        severity,
        title: "Upcoming tax date",
        message: `Your next tax date is ${formatDate(taxProfile.nextTaxDate)} (${formatDays(daysUntilTax)} away). Your reserve is ${formatCurrency(wallet.lockedTaxReserve, wallet.currency)}.`,
        suggestions: [
          "Avoid spending from your tax reserve",
          "If you expect lower income, consider increasing reserve percentage",
        ],
        factors: [
          { label: "Tax date", value: formatDate(taxProfile.nextTaxDate) },
          { label: "Tax reserve", value: formatCurrency(wallet.lockedTaxReserve, wallet.currency) },
        ],
      });
    }

    if (commitments.itemsDueSoon.length > 0) {
      const next = commitments.itemsDueSoon[0];
      const daysUntil = Math.ceil((next.date - now) / (24 * 60 * 60 * 1000));
      if (next.type === "expense" && daysUntil <= 7 && next.priority !== "optional") {
        alerts.push({
          id: `next_due_${next.name}_${next.date}`,
          severity: next.priority === "critical" ? "critical" : "watch",
          title: "A key payment is coming up soon",
          message: `${next.name} (${formatCurrency(next.amount, wallet.currency)}) is due on ${formatDate(next.date)}.`,
          suggestions: ["Confirm the payment method", "Keep buffer cash until this clears"],
          factors: [
            { label: "Due date", value: formatDate(next.date) },
            { label: "Priority", value: next.priority },
          ],
        });
      }
    }

    return alerts;
  },
});

export const getDecisionExplanation = query({
  args: {
    context: v.union(v.literal("wallet_action"), v.literal("what_if"), v.literal("risk_warning")),
    actionType: v.optional(v.string()),
    scenario: v.optional(
      v.object({
        type: v.union(v.literal("income"), v.literal("expense")),
        amount: v.number(),
        date: v.optional(v.number()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
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

    const now = Date.now();
    const commitments30 = computeCommitmentsInWindow({
      now,
      windowEnd: addDays(now, 30),
      recurringItems: recurringItems.map((r) => ({
        type: r.type,
        amount: r.amount,
        nextDate: r.nextDate,
        frequency: r.frequency,
        isActive: r.isActive,
        endDate: r.endDate,
        priority: r.priority,
        name: r.name,
      })),
    });

    const runwayDays = riskAssessment?.runwayDays ?? 0;
    const riskLevel = riskAssessment?.riskLevel ?? "healthy";

    if (args.context === "wallet_action") {
      const base = {
        label: "Explainable Financial Intelligence",
        headline: "Here’s what this means for your cash",
        explanation: "",
        keyDrivers: [] as Array<{ label: string; value: string }>,
      };

      switch (args.actionType) {
        case "start_simulation":
          return {
            ...base,
            headline: "Simulation keeps your real wallet safe",
            explanation:
              "You can test decisions without changing real balances. This is useful when runway is tight or upcoming commitments are uncertain.",
            keyDrivers: [
              { label: "Current runway", value: formatDays(runwayDays) },
              { label: "Risk level", value: riskLevel },
            ],
          };
        case "apply_simulation":
          return {
            ...base,
            headline: "Applying will make all simulated changes real",
            explanation:
              "Once applied, your balances and risk signals will update based on the new cash position and your upcoming commitments.",
            keyDrivers: [
              { label: "Upcoming 30-day expenses", value: formatCurrency(commitments30.expenseTotal, wallet.currency) },
              { label: "Tax reserve", value: formatCurrency(wallet.lockedTaxReserve, wallet.currency) },
            ],
          };
        case "discard_simulation":
          return {
            ...base,
            headline: "Discarding returns you to your original plan",
            explanation:
              "This keeps your real wallet unchanged and preserves your current runway and risk posture.",
            keyDrivers: [
              { label: "Current runway", value: formatDays(runwayDays) },
              { label: "Risk level", value: riskLevel },
            ],
          };
        default:
          return {
            ...base,
            explanation:
              "This action affects how much cash is safely spendable today versus reserved for taxes, safety buffers, and future commitments.",
            keyDrivers: [
              { label: "Available cash", value: formatCurrency(wallet.availableCash, wallet.currency) },
              { label: "Upcoming 30-day expenses", value: formatCurrency(commitments30.expenseTotal, wallet.currency) },
            ],
          };
      }
    }

    if (args.context === "risk_warning") {
      const base = {
        label: "Explainable Financial Intelligence",
        headline: "Why this warning is showing up",
        explanation: "",
        keyDrivers: [] as Array<{ label: string; value: string }>,
      };

      const warnings: string[] = [];
      if (runwayDays > 0 && runwayDays < 90) {
        warnings.push(`runway is only ${formatDays(runwayDays)}`);
      }
      if (commitments30.expensesByPriority.critical > 0 && wallet.availableCash < commitments30.expensesByPriority.critical) {
        warnings.push("critical commitments exceed available cash");
      }
      if (taxProfile?.nextTaxDate && taxProfile.nextTaxDate <= addDays(now, 45)) {
        warnings.push("a tax date is approaching");
      }

      const reason = warnings.length > 0 ? warnings.join(", ") : "cashflow signals changed";

      return {
        ...base,
        explanation: `This warning is triggered because ${reason}. The goal is to give you time to act early, not after a missed payment.`,
        keyDrivers: [
          { label: "Available cash", value: formatCurrency(wallet.availableCash, wallet.currency) },
          { label: "30-day critical commitments", value: formatCurrency(commitments30.expensesByPriority.critical, wallet.currency) },
          { label: "Runway", value: formatDays(runwayDays) },
        ],
      };
    }

    if (args.context === "what_if" && args.scenario) {
      const amount = args.scenario.amount;
      const projectedMonthlyNetBurn = (commitments30.expenseTotal - commitments30.incomeTotal) / 1;
      const approxDailyNetBurn = projectedMonthlyNetBurn / 30;

      const beforeRunway = runwayDays;
      const balanceAfter = args.scenario.type === "expense" ? wallet.totalBalance - amount : wallet.totalBalance + amount;

      const availableAfter = args.scenario.type === "expense" ? Math.max(0, wallet.availableCash - amount) : wallet.availableCash + amount;

      const afterRunway = approxDailyNetBurn > 0 ? Math.max(0, Math.floor(availableAfter / approxDailyNetBurn)) : 365;

      const base = {
        label: "Explainable Financial Intelligence",
        headline: "Decision impact explained like a CFO",
        explanation: "",
        keyDrivers: [] as Array<{ label: string; value: string }>,
      };

      const delta = afterRunway - beforeRunway;
      const direction = delta < 0 ? "drops" : "improves";

      const contextDate = args.scenario.date ? ` on ${formatDate(args.scenario.date)}` : "";
      const kind = args.scenario.type === "expense" ? "buy" : "receive";
      const subject = args.scenario.description ? args.scenario.description : "this";

      base.explanation = `If you ${kind} ${subject}${contextDate}, your runway ${direction} from ${formatDays(beforeRunway)} to ${formatDays(afterRunway)} because it changes your spendable cash while your upcoming commitments stay the same.`;

      base.keyDrivers = [
        { label: "Amount", value: formatCurrency(amount, wallet.currency) },
        { label: "Runway (before)", value: formatDays(beforeRunway) },
        { label: "Runway (after)", value: formatDays(afterRunway) },
        { label: "30-day commitments", value: formatCurrency(commitments30.expenseTotal, wallet.currency) },
        { label: "Tax reserve", value: formatCurrency(wallet.lockedTaxReserve, wallet.currency) },
      ];

      return {
        ...base,
        balanceAfter: formatCurrency(balanceAfter, wallet.currency),
        runwayDeltaDays: delta,
      };
    }

    return null;
  },
});

export const compareScenarios = query({
  args: {
    scenarios: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(v.literal("income"), v.literal("expense"), v.literal("none")),
        amount: v.optional(v.number()),
        date: v.optional(v.number()),
        description: v.optional(v.string()),
      })
    ),
    weights: v.optional(
      v.object({
        runway: v.number(),
        balance: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
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

    const recurringItems = await ctx.db
      .query("recurringItems")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const now = Date.now();
    const commitments30 = computeCommitmentsInWindow({
      now,
      windowEnd: addDays(now, 30),
      recurringItems: recurringItems.map((r) => ({
        type: r.type,
        amount: r.amount,
        nextDate: r.nextDate,
        frequency: r.frequency,
        isActive: r.isActive,
        endDate: r.endDate,
        priority: r.priority,
        name: r.name,
      })),
    });

    const projectedMonthlyNetBurn = commitments30.expenseTotal - commitments30.incomeTotal;
    const approxDailyNetBurn = projectedMonthlyNetBurn / 30;

    const baseline = {
      totalBalance: wallet.totalBalance,
      availableCash: wallet.availableCash,
      runwayDays: riskAssessment?.runwayDays ?? 0,
      riskLevel: riskAssessment?.riskLevel ?? "healthy",
    };

    const results = args.scenarios.map((s) => {
      const amount = s.type === "none" ? 0 : Math.max(0, s.amount ?? 0);
      const balanceAfter = s.type === "expense" ? wallet.totalBalance - amount : s.type === "income" ? wallet.totalBalance + amount : wallet.totalBalance;
      const availableAfter = s.type === "expense" ? Math.max(0, wallet.availableCash - amount) : s.type === "income" ? wallet.availableCash + amount : wallet.availableCash;

      const runwayAfter = approxDailyNetBurn > 0 ? Math.max(0, Math.floor(availableAfter / approxDailyNetBurn)) : 365;

      let riskLevel: "healthy" | "watch" | "critical" = "healthy";
      if (runwayAfter < 30) riskLevel = "critical";
      else if (runwayAfter < 90) riskLevel = "watch";

      const runwayDelta = runwayAfter - baseline.runwayDays;
      const availableDelta = availableAfter - baseline.availableCash;

      const tradeoffs: string[] = [];
      if (s.type !== "none") {
        tradeoffs.push(
          s.type === "expense"
            ? `You spend ${formatCurrency(amount, wallet.currency)} now, reducing available cash.`
            : `You add ${formatCurrency(amount, wallet.currency)} cash, improving buffer.`
        );
      } else {
        tradeoffs.push("No new cash impact; you keep the current plan.");
      }

      if (runwayDelta < 0) {
        tradeoffs.push(`Runway drops by ${formatDays(Math.abs(runwayDelta))} based on your 30-day commitments.`);
      } else if (runwayDelta > 0) {
        tradeoffs.push(`Runway improves by ${formatDays(runwayDelta)} with the same commitments.`);
      } else {
        tradeoffs.push("Runway stays roughly the same under current commitments.");
      }

      if (commitments30.expensesByPriority.critical > 0 && availableAfter < commitments30.expensesByPriority.critical) {
        tradeoffs.push("This option may pressure upcoming critical commitments.");
      }

      return {
        id: s.id,
        name: s.name,
        type: s.type,
        amount,
        balanceAfter,
        availableAfter,
        runwayAfter,
        runwayDelta,
        availableDelta,
        riskLevel,
        tradeoffs,
      };
    });

    // Scoring Logic
    const maxRunway = Math.max(...results.map(r => r.runwayAfter), 1);
    const maxBalance = Math.max(...results.map(r => r.balanceAfter), 1);
    
    const wRunway = args.weights?.runway ?? 0.7;
    const wBalance = args.weights?.balance ?? 0.3;

    const scoredResults = results.map(r => {
      const runwayScore = (r.runwayAfter / maxRunway) * 100;
      const balanceScore = (r.balanceAfter / maxBalance) * 100;
      const finalScore = (runwayScore * wRunway) + (balanceScore * wBalance);
      return { ...r, score: finalScore };
    });

    const best = [...scoredResults].sort((a, b) => b.score - a.score)[0];

    return {
      baseline,
      commitments: {
        next30DaysExpenses: commitments30.expenseTotal,
        next30DaysIncome: commitments30.incomeTotal,
        criticalNext30Days: commitments30.expensesByPriority.critical,
      },
      results: scoredResults,
      bestScenarioId: best?.id,
    };
  },
});

export const getCashFlowHealthScore = query({
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

    const now = Date.now();
    const commitments30 = computeCommitmentsInWindow({
      now,
      windowEnd: addDays(now, 30),
      recurringItems: recurringItems.map((r) => ({
        type: r.type,
        amount: r.amount,
        nextDate: r.nextDate,
        frequency: r.frequency,
        isActive: r.isActive,
        endDate: r.endDate,
        priority: r.priority,
        name: r.name,
      })),
    });

    const runwayDays = riskAssessment?.runwayDays ?? 0;
    const runwayScore = clamp((runwayDays / 180) * 100, 0, 100);

    const monthlyIncome = commitments30.incomeTotal;
    const monthlyExpenses = commitments30.expenseTotal;
    const incomeCoverage = monthlyExpenses > 0 ? monthlyIncome / monthlyExpenses : monthlyIncome > 0 ? 2 : 0;
    const incomeStabilityScore = clamp(incomeCoverage * 60, 0, 100);

    const criticalRatio = monthlyExpenses > 0 ? commitments30.expensesByPriority.critical / monthlyExpenses : 0;
    const expenseRigidityScore = clamp(100 - criticalRatio * 100, 0, 100);

    const recommendedReserve = wallet.totalBalance * (taxProfile?.reservePercentage ?? 0.25);
    const taxReadinessScore = recommendedReserve > 0 ? clamp((wallet.lockedTaxReserve / recommendedReserve) * 100, 0, 120) : 100;

    const score = Math.round(
      clamp(
        runwayScore * 0.45 + incomeStabilityScore * 0.25 + expenseRigidityScore * 0.15 + taxReadinessScore * 0.15,
        0,
        100
      )
    );

    const grade = scoreToGrade(score);

    const explanation =
      `Your score is driven by runway (${formatDays(runwayDays)}), ` +
      `income coverage (${formatCurrency(monthlyIncome, wallet.currency)} vs ${formatCurrency(monthlyExpenses, wallet.currency)} in the next 30 days), ` +
      `expense rigidity (critical commitments: ${formatCurrency(commitments30.expensesByPriority.critical, wallet.currency)}), ` +
      `and tax readiness (reserved: ${formatCurrency(wallet.lockedTaxReserve, wallet.currency)}).`;

    return {
      label: "Cash Flow Health Score",
      score,
      grade,
      explanation,
      factors: [
        { label: "Runway", value: formatDays(runwayDays) },
        { label: "30-day income", value: formatCurrency(monthlyIncome, wallet.currency) },
        { label: "30-day expenses", value: formatCurrency(monthlyExpenses, wallet.currency) },
        { label: "Critical commitments", value: formatCurrency(commitments30.expensesByPriority.critical, wallet.currency) },
        { label: "Tax reserve", value: formatCurrency(wallet.lockedTaxReserve, wallet.currency) },
      ],
    };
  },
});
