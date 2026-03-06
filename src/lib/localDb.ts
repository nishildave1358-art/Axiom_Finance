import type { AuthUser } from "./authTypes";

const DB_KEY = "axiom_local_db";
const SESSION_KEY = "axiom_local_session";

type DbSchema = {
    meta: { createdAt: number };
    users: any[];
    sessions: any[];
    transactions: any[];
    goals: any[];
    simulations: any[];
};

function now() {
    return Date.now();
}

function loadDb(): DbSchema {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            // ignore
        }
    }
    const initial: DbSchema = {
        meta: { createdAt: now() },
        users: [],
        sessions: [],
        transactions: [],
        goals: [],
        simulations: [],
    };
    saveDb(initial);
    return initial;
}

function saveDb(db: DbSchema) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function randomId(prefix = "") {
    return `${prefix}${Math.random().toString(36).substring(2, 15)}`;
}

function normalizeEmail(email: string) {
    return String(email || "").trim().toLowerCase();
}

// Simple hash for local storage (Not for production security, but better than plain text)
async function hashPassword(password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function createSession(db: DbSchema, userId: string) {
    const token = randomId("sess_");
    const expiresAt = now() + 30 * 24 * 60 * 60 * 1000;
    db.sessions.push({ id: randomId("s_"), token, userId, createdAt: now(), expiresAt });
    localStorage.setItem(SESSION_KEY, token);
    return { token, expiresAt };
}

function destroySession(db: DbSchema, token: string) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    localStorage.removeItem(SESSION_KEY);
}

function getSession(db: DbSchema, token: string) {
    const sess = db.sessions.find((s) => s.token === token);
    if (!sess) return null;
    if (sess.expiresAt <= now()) {
        destroySession(db, token);
        return null;
    }
    return sess;
}

function sanitizeUser(user: any): AuthUser {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isGuest: user.isGuest,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
    };
}

function getAuthedUser(db: DbSchema) {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return null;
    const sess = getSession(db, token);
    if (!sess) return null;
    const user = db.users.find((u) => u.id === sess.userId);
    if (!user) return null;
    return user;
}

function ensureSeedData(db: DbSchema, userId: string) {
    const hasAny = db.transactions.some((t) => t.userId === userId) || db.goals.some((g) => g.userId === userId);
    if (hasAny) return;

    const baseNow = now();
    db.transactions.push(
        {
            id: randomId("tx_"),
            userId,
            type: "income",
            amount: 800000,
            description: "Freelance Project Payment",
            category: "salary",
            date: baseNow - 2 * 86400000,
            tags: ["freelance"],
            createdAt: baseNow,
        },
        {
            id: randomId("tx_"),
            userId,
            type: "expense",
            amount: 250000,
            description: "Office Rent",
            category: "housing",
            date: baseNow - 3 * 86400000,
            tags: ["rent"],
            createdAt: baseNow,
        },
        {
            id: randomId("tx_"),
            userId,
            type: "expense",
            amount: 45000,
            description: "Software Subscription",
            category: "software",
            date: baseNow - 5 * 86400000,
            tags: ["subscription"],
            createdAt: baseNow,
        }
    );

    db.goals.push(
        {
            id: randomId("g_"),
            userId,
            name: "Emergency Fund",
            targetAmount: 1000000,
            currentAmount: 750000,
            targetDate: baseNow + 90 * 86400000,
            category: "savings",
            priority: "high",
            isActive: true,
            createdAt: baseNow,
        },
        {
            id: randomId("g_"),
            userId,
            name: "New Laptop",
            targetAmount: 150000,
            currentAmount: 50000,
            targetDate: baseNow + 30 * 86400000,
            category: "purchase",
            priority: "medium",
            isActive: true,
            createdAt: baseNow,
        }
    );
}

function monthKey(ts: number) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString("en-US", { month: "short" });
}

function computeDashboard(db: DbSchema, userId: string) {
    const seedBaseBalance = 4250000;
    const txs = db.transactions.filter((t) => t.userId === userId);

    const incomeTotal = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenseTotal = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalBalance = Math.max(0, seedBaseBalance + incomeTotal - expenseTotal);

    const lockedTaxReserve = Math.round(totalBalance * 0.25);
    const riskZoneCash = Math.round(totalBalance * 0.1);
    const futureCommittedCash = Math.round(totalBalance * 0.05);
    const availableCash = Math.max(0, totalBalance - lockedTaxReserve - riskZoneCash - futureCommittedCash);

    const nowTs = now();
    const last30Cutoff = nowTs - 30 * 86400000;
    const last30Expenses = txs
        .filter((t) => t.type === "expense" && t.date >= last30Cutoff)
        .reduce((s, t) => s + t.amount, 0);
    const monthlyBurnRate = Math.max(1, Math.round(last30Expenses || 350000));
    const runwayDays = Math.max(0, Math.round((availableCash / monthlyBurnRate) * 30));
    const riskLevel = runwayDays > 90 ? "healthy" : runwayDays > 45 ? "watch" : "critical";

    const trendMap = new Map();
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const k = monthKey(d.getTime());
        trendMap.set(k, { income: 0, expenses: 0 });
    }
    for (const t of txs) {
        const k = monthKey(t.date);
        if (!trendMap.has(k)) continue;
        const entry = trendMap.get(k);
        if (t.type === "income") entry.income += t.amount;
        if (t.type === "expense") entry.expenses += t.amount;
    }

    let running = seedBaseBalance;
    const trendData = Array.from(trendMap.entries()).map(([k, v]) => {
        running = Math.max(0, running + v.income - v.expenses);
        return {
            month: monthLabel(k),
            balance: running,
            income: v.income,
            expenses: v.expenses,
        };
    });

    const catMap = new Map();
    for (const t of txs) {
        if (t.type !== "expense") continue;
        if (t.date < last30Cutoff) continue;
        const cat = t.category || "other";
        catMap.set(cat, (catMap.get(cat) || 0) + t.amount);
    }
    const expenseCategories = Array.from(catMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const analytics = {
        monthlyBurnRate,
        runwayDays,
        cashFlowScore: Math.max(10, Math.min(95, 30 + Math.round(runwayDays / 2))),
        expenseCategories,
        incomeSources: [
            { name: "Income", value: incomeTotal || 0 },
            { name: "Other", value: Math.max(0, incomeTotal * 0.1) },
        ],
        trendData,
    };

    const wallet = {
        totalBalance,
        availableCash,
        lockedTaxReserve,
        riskZoneCash,
        futureCommittedCash,
        runwayDays,
        riskLevel,
        currency: "INR",
        lastUpdated: nowTs,
    };

    return { wallet, analytics };
}

export const localApi = {
    authMe: async () => {
        const db = loadDb();
        const user = getAuthedUser(db);
        return { user: user ? sanitizeUser(user) : null };
    },

    authGuest: async () => {
        const db = loadDb();
        const user = {
            id: randomId("u_"),
            email: null,
            name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
            isGuest: true,
            passwordHash: null,
            createdAt: now(),
            lastLoginAt: now(),
        };
        db.users.push(user);
        createSession(db, user.id);
        saveDb(db);
        return { user: sanitizeUser(user) };
    },

    authSignup: async (body: any) => {
        const db = loadDb();
        const email = normalizeEmail(body?.email);
        const password = String(body?.password || "");
        const name = String(body?.name || "").trim();

        if (!email) throw new Error("Email is required");
        if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");
        if (!name) throw new Error("Name is required");

        const existing = db.users.find((u) => u.email === email);
        if (existing) throw new Error("Email already in use");

        const hash = await hashPassword(password);
        const user = {
            id: randomId("u_"),
            email,
            name,
            isGuest: false,
            passwordHash: hash,
            createdAt: now(),
            lastLoginAt: now(),
        };
        db.users.push(user);
        createSession(db, user.id);
        saveDb(db);
        return { user: sanitizeUser(user) };
    },

    authLogin: async (body: any) => {
        const db = loadDb();
        const email = normalizeEmail(body?.email);
        const password = String(body?.password || "");

        if (!email) throw new Error("Email is required");
        if (!password) throw new Error("Password is required");

        const user = db.users.find((u) => u.email === email);
        if (!user || user.isGuest) throw new Error("Invalid email or password");

        const hash = await hashPassword(password);
        if (user.passwordHash !== hash) throw new Error("Invalid email or password");

        user.lastLoginAt = now();
        createSession(db, user.id);
        saveDb(db);
        return { user: sanitizeUser(user) };
    },

    authLogout: async () => {
        const db = loadDb();
        const token = localStorage.getItem(SESSION_KEY);
        if (token) destroySession(db, token);
        saveDb(db);
        return { ok: true };
    },

    updateUser: async (body: any) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");

        if (body.name !== undefined) user.name = String(body.name).trim();
        if (body.email !== undefined) user.email = normalizeEmail(body.email);
        if (body.image !== undefined) user.image = String(body.image).trim();

        saveDb(db);
        return { user: sanitizeUser(user) };
    },

    getTransactions: async (query: any) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        ensureSeedData(db, user.id);

        const range = String(query?.range || "month");
        const cutoff =
            range === "week"
                ? now() - 7 * 86400000
                : range === "quarter"
                    ? now() - 90 * 86400000
                    : range === "year"
                        ? now() - 365 * 86400000
                        : now() - 30 * 86400000;

        const items = db.transactions
            .filter((t) => t.userId === user.id && t.date >= cutoff)
            .sort((a, b) => b.date - a.date);

        saveDb(db);
        return { transactions: items };
    },

    getDashboard: async () => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        ensureSeedData(db, user.id);
        const data = computeDashboard(db, user.id);
        saveDb(db);
        return data;
    },

    postTransaction: async (body: any) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        ensureSeedData(db, user.id);

        const type = String(body?.type || "expense");
        const amount = Number(body?.amount);
        const description = String(body?.description || "").trim();
        const category = String(body?.category || "other");
        const date = Number(body?.date || now());
        const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t)).filter(Boolean) : [];

        if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be a positive number");
        if (!description) throw new Error("Description is required");

        const tx = {
            id: randomId("tx_"),
            userId: user.id,
            type,
            amount,
            description,
            category,
            date,
            tags,
            createdAt: now(),
        };

        db.transactions.push(tx);
        saveDb(db);
        return { transaction: tx };
    },

    deleteTransaction: async (id: string) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        db.transactions = db.transactions.filter((t) => !(t.userId === user.id && t.id === id));
        saveDb(db);
        return { ok: true };
    },

    getGoals: async () => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        ensureSeedData(db, user.id);
        const items = db.goals.filter((g) => g.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
        saveDb(db);
        return { goals: items };
    },

    postGoal: async (body: any) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");

        const name = String(body?.name || "").trim();
        const targetAmount = Number(body?.targetAmount);
        const targetDate = Number(body?.targetDate);
        const category = String(body?.category || "savings");

        if (!name) throw new Error("Name is required");
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) throw new Error("Target amount must be a positive number");

        const goal = {
            id: randomId("g_"),
            userId: user.id,
            name,
            targetAmount,
            currentAmount: 0,
            targetDate,
            category,
            isActive: true,
            createdAt: now(),
        };

        db.goals.push(goal);
        saveDb(db);
        return { goal };
    },

    deleteGoal: async (id: string) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        db.goals = db.goals.filter((g) => !(g.userId === user.id && g.id === id));
        saveDb(db);
        return { ok: true };
    },

    contributeToGoal: async (id: string, body: any) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        const amount = Number(body?.amount);
        const goal = db.goals.find((g) => g.userId === user.id && g.id === id);
        if (!goal) throw new Error("Goal not found");
        goal.currentAmount = (goal.currentAmount || 0) + amount;
        saveDb(db);
        return { goal };
    },

    getSimulations: async () => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        const items = db.simulations
            .filter((s) => s.userId === user.id)
            .sort((a, b) => b.createdAt - a.createdAt);
        saveDb(db);
        return { simulations: items };
    },

    deleteSimulation: async (id: string) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");
        db.simulations = db.simulations.filter((s) => !(s.userId === user.id && s.id === id));
        saveDb(db);
        return { ok: true };
    },

    runSimulation: async (body: any) => {
        const db = loadDb();
        const user = getAuthedUser(db);
        if (!user) throw new Error("Not authenticated");

        const { wallet, analytics } = computeDashboard(db, user.id);
        const baselineRunway = wallet.runwayDays;
        const baselineBalance = wallet.totalBalance;
        const baselineBurn = analytics.monthlyBurnRate;

        const changes = Array.isArray(body?.changes) ? body.changes : [];
        let delta = 0;
        let monthlyDelta = 0;

        for (const c of changes) {
            const amt = Number(c?.amount);
            if (!Number.isFinite(amt)) continue;
            const type = String(c?.type || "income");

            // Assume simulator changes are monthly impacts for runway calculation
            if (type === "expense") {
                delta -= amt;
                monthlyDelta -= amt;
            } else {
                delta += amt;
                monthlyDelta += amt;
            }
        }

        const projectedBalance = Math.max(0, baselineBalance + delta);
        const newMonthlyBurn = Math.max(1, baselineBurn - (monthlyDelta < 0 ? Math.abs(monthlyDelta) : 0) + (monthlyDelta > 0 ? 0 : 0));
        // Simple logic: if we add an expense, burn goes up. If we add income, it doesn't necessarily reduce 'burn' but increases runway.

        // Let's refine the runway impact:
        // New Runway = Projected Balance / (Baseline Burn + net monthly expense change)
        const netMonthlyExpenseChange = changes
            .filter(c => c.type === "expense")
            .reduce((s, c) => s + (Number(c.amount) || 0), 0) -
            changes
                .filter(c => c.type === "income")
                .reduce((s, c) => s + (Number(c.amount) || 0), 0);

        const adjustedBurn = Math.max(1, baselineBurn + netMonthlyExpenseChange / 1); // Simplistic
        const newRunway = Math.round((projectedBalance / Math.max(1, adjustedBurn)) * 30);

        const runwayDeltaDays = newRunway - baselineRunway;
        const impact = `${runwayDeltaDays >= 0 ? "+" : ""}${runwayDeltaDays} days`;

        const results = {
            originalRunway: baselineRunway,
            newRunway,
            impact,
            projectedBalance,
        };

        const run = {
            id: randomId("sim_"),
            userId: user.id,
            createdAt: now(),
            changes: changes.map((c: any) => ({
                id: randomId("c_"),
                type: String(c?.type || "income"),
                category: String(c?.category || ""),
                amount: Number(c?.amount) || 0,
            })),
            results,
        };

        db.simulations.push(run);
        saveDb(db);
        return { results, runId: run.id };
    }
};
