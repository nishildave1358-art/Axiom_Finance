import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Start a new simulation session
export const startSimulation = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) throw new Error("Wallet not found");

    // End any existing simulation
    const existingSimulation = await ctx.db
      .query("simulations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingSimulation) {
      await ctx.db.patch(existingSimulation._id, { isActive: false });
    }

    // Create new simulation session
    const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const originalState = {
      totalBalance: wallet.totalBalance,
      availableCash: wallet.availableCash,
      lockedTaxReserve: wallet.lockedTaxReserve,
      riskZoneCash: wallet.riskZoneCash,
      futureCommittedCash: wallet.futureCommittedCash,
    };

    const simulationId = await ctx.db.insert("simulations", {
      userId,
      walletId: wallet._id,
      sessionId,
      isActive: true,
      startedAt: Date.now(),
      originalState,
      simulatedState: { ...originalState },
      changes: [],
    });

    // Mark wallet as in simulation mode
    await ctx.db.patch(wallet._id, {
      isSimulationActive: true,
      simulatedBalance: wallet.totalBalance,
    });

    return {
      sessionId,
      simulationId,
      originalState,
    };
  },
});

// Add a change to the current simulation
export const addSimulationChange = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const simulation = await ctx.db
      .query("simulations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!simulation) throw new Error("No active simulation");

    const wallet = await ctx.db.get(simulation.walletId);
    if (!wallet) throw new Error("Wallet not found");

    // Calculate new simulated state
    const currentState = simulation.simulatedState;
    let newState = { ...currentState };

    if (args.type === "expense") {
      newState.totalBalance -= args.amount;
      newState.availableCash = Math.max(0, newState.availableCash - args.amount);
    } else if (args.type === "income") {
      newState.totalBalance += args.amount;
      // Recalculate buckets proportionally
      const taxProfile = await ctx.db
        .query("taxProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      const taxReserve = args.amount * (taxProfile?.reservePercentage || 0.25);
      newState.lockedTaxReserve += taxReserve;
      newState.availableCash += (args.amount - taxReserve);
    }

    // Add the change to the simulation
    const newChange = {
      type: args.type,
      description: args.description,
      impact: args.type === "expense" ? -args.amount : args.amount,
      timestamp: Date.now(),
    };

    await ctx.db.patch(simulation._id, {
      simulatedState: newState,
      changes: [...simulation.changes, newChange],
    });

    // Update wallet's simulated balance
    await ctx.db.patch(wallet._id, {
      simulatedBalance: newState.totalBalance,
    });

    return {
      newState,
      change: newChange,
      totalChanges: simulation.changes.length + 1,
    };
  },
});

// Get current simulation state
export const getSimulationState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const simulation = await ctx.db
      .query("simulations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!simulation) return null;

    // Calculate impact metrics
    const originalState = simulation.originalState;
    const simulatedState = simulation.simulatedState;

    const balanceChange = simulatedState.totalBalance - originalState.totalBalance;
    const availableChange = simulatedState.availableCash - originalState.availableCash;

    // Calculate simulated runway
    const monthlyBurn = simulatedState.futureCommittedCash;
    const simulatedRunway = simulatedState.availableCash > 0 && monthlyBurn > 0
      ? Math.floor((simulatedState.availableCash / monthlyBurn) * 30)
      : simulatedState.availableCash > 0 ? 365 : 0;

    const originalRunway = originalState.availableCash > 0 && monthlyBurn > 0
      ? Math.floor((originalState.availableCash / monthlyBurn) * 30)
      : originalState.availableCash > 0 ? 365 : 0;

    const runwayChange = simulatedRunway - originalRunway;

    let riskLevel: "healthy" | "watch" | "critical" = "healthy";
    if (simulatedRunway < 30) riskLevel = "critical";
    else if (simulatedRunway < 90) riskLevel = "watch";

    return {
      sessionId: simulation.sessionId,
      isActive: simulation.isActive,
      startedAt: simulation.startedAt,
      originalState,
      simulatedState,
      changes: simulation.changes,
      impact: {
        balanceChange,
        availableChange,
        runwayChange,
        riskLevel,
        simulatedRunway,
        originalRunway,
      },
      summary: {
        totalChanges: simulation.changes.length,
        netImpact: balanceChange,
        riskLevelChange: riskLevel !== "healthy",
      },
    };
  },
});

// Apply simulation changes to real wallet
export const applySimulation = mutation({
  args: {
    confirmationToken: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const simulation = await ctx.db
      .query("simulations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!simulation) throw new Error("No active simulation");

    const wallet = await ctx.db.get(simulation.walletId);
    if (!wallet) throw new Error("Wallet not found");

    // Validate confirmation token (simple implementation)
    const expectedToken = `confirm_${simulation.sessionId}`;
    if (args.confirmationToken !== expectedToken) {
      throw new Error("Invalid confirmation token");
    }

    // Apply simulated state to real wallet
    await ctx.db.patch(wallet._id, {
      totalBalance: simulation.simulatedState.totalBalance,
      availableCash: simulation.simulatedState.availableCash,
      lockedTaxReserve: simulation.simulatedState.lockedTaxReserve,
      riskZoneCash: simulation.simulatedState.riskZoneCash,
      futureCommittedCash: simulation.simulatedState.futureCommittedCash,
      isSimulationActive: false,
      simulatedBalance: undefined,
      lastUpdated: Date.now(),
    });

    // Create transactions for each change
    for (const change of simulation.changes) {
      await ctx.db.insert("transactions", {
        walletId: wallet._id,
        userId,
        type: change.type === "expense" ? "expense" : "income",
        amount: Math.abs(change.impact),
        description: change.description,
        category: "simulation_applied",
        date: change.timestamp,
        isRecurring: false,
        isSimulated: false,
        tags: ["simulation", "applied"],
      });
    }

    // Log the application
    await ctx.db.insert("actionLogs", {
      userId,
      walletId: wallet._id,
      actionType: "simulation_applied",
      description: `Applied simulation with ${simulation.changes.length} changes`,
      beforeState: {
        totalBalance: simulation.originalState.totalBalance,
        availableCash: simulation.originalState.availableCash,
        runwayDays: 0,
        riskLevel: "unknown",
      },
      afterState: {
        totalBalance: simulation.simulatedState.totalBalance,
        availableCash: simulation.simulatedState.availableCash,
        runwayDays: 0,
        riskLevel: "unknown",
      },
      confirmed: true,
      confirmedAt: Date.now(),
      ipAddress: "system",
      userAgent: "system",
    });

    // End simulation
    await ctx.db.patch(simulation._id, { isActive: false });

    return {
      success: true,
      appliedChanges: simulation.changes.length,
      newBalance: simulation.simulatedState.totalBalance,
    };
  },
});

// Discard simulation
export const discardSimulation = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const simulation = await ctx.db
      .query("simulations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!simulation) throw new Error("No active simulation");

    const wallet = await ctx.db.get(simulation.walletId);
    if (!wallet) throw new Error("Wallet not found");

    // Reset wallet to original state
    await ctx.db.patch(wallet._id, {
      isSimulationActive: false,
      simulatedBalance: undefined,
    });

    // End simulation
    await ctx.db.patch(simulation._id, { isActive: false });

    return {
      success: true,
      discardedChanges: simulation.changes.length,
    };
  },
});
