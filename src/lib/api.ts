import { localApi } from "./localDb";

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  // Intercept API calls for local-first execution on Netlify
  if (path.startsWith("/api/")) {
    const route = path.replace("/api/", "");
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const method = init?.method || "GET";

    try {
      if (route === "auth/me") return (await localApi.authMe()) as T;
      if (route === "auth/guest") return (await localApi.authGuest()) as T;
      if (route === "auth/signup") return (await localApi.authSignup(body)) as T;
      if (route === "auth/login") return (await localApi.authLogin(body)) as T;
      if (route === "auth/logout") return (await localApi.authLogout()) as T;
      if (route === "auth/update") return (await localApi.updateUser(body)) as T;

      if (route === "dashboard") return (await localApi.getDashboard()) as T;

      if (route === "transactions") {
        if (method === "GET") {
          const url = new URL(path, window.location.origin);
          return (await localApi.getTransactions(Object.fromEntries(url.searchParams))) as T;
        }
        if (method === "POST") return (await localApi.postTransaction(body)) as T;
      }

      if (route.startsWith("transactions/")) {
        const id = route.split("/")[1];
        if (method === "DELETE") return (await localApi.deleteTransaction(id)) as T;
      }

      if (route === "goals") {
        if (method === "GET") return (await localApi.getGoals()) as T;
        if (method === "POST") return (await localApi.postGoal(body)) as T;
      }

      if (route.startsWith("goals/")) {
        const parts = route.split("/");
        const id = parts[1];
        if (method === "DELETE") return (await localApi.deleteGoal(id)) as T;
        if (parts[2] === "contribute") return (await localApi.contributeToGoal(id, body)) as T;
      }

      if (route === "simulations") {
        if (method === "GET") return (await localApi.getSimulations()) as T;
      }

      if (route.startsWith("simulations/")) {
        const id = route.split("/")[1];
        if (route.endsWith("/run")) return (await localApi.runSimulation(body)) as T;
        if (method === "DELETE") return (await localApi.deleteSimulation(id)) as T;
      }

      if (route === "simulations/run") return (await localApi.runSimulation(body)) as T;

    } catch (err: any) {
      throw new Error(err.message || "Local API error");
    }
  }

  // Fallback for non-intercepted calls
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      credentials: "include",
    });
  } catch {
    throw new Error("Cannot reach local backend. Make sure `npm run dev` is running.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = String(data.error);
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
