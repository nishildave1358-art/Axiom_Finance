import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submitContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    await ctx.db.insert("contactMessages", {
      userId: userId ?? undefined,
      name: args.name.trim(),
      email: args.email.trim().toLowerCase(),
      message: args.message.trim(),
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
