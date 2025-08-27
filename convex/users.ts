import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const syncUser = mutation( {
    args:{
        userId: v.string(),
        email: v.string(),
        name: v.string(),
    },

    handler: async(ctx, args) => {
        try {
            console.log("syncUser called with args:", args);
            const existUser = await ctx.db.query("users").filter((q) => q.eq(q.field("userId"), args.userId)).first();

            if (!existUser) {
                const inserted = await ctx.db.insert("users", {
                    userId: args.userId,
                    email: args.email,
                    name: args.name,
                    isPro: false,
                    createdAt: Date.now(),
                });
                console.log("User created in Convex with id:", inserted);
                return { created: true, id: inserted };
            } else {
                console.log("User already exists in Convex:", existUser);
                return { created: false, reason: "User already exists" };
            }
        } catch (error) {
            console.error("Error in syncUser mutation:", error);
            let message = "";
            if (error instanceof Error) {
                message = error.message;
            } else {
                message = String(error);
            }
            throw new Error("Failed to sync user: " + message);
        }
    }
} )

export const getUser = query({
    args: {userId : v.string()},
    handler: async (ctx, args) => {
        if(!args.userId) return null;

        const user = await ctx.db.query("users").withIndex("by_user_id").filter((q) => q.eq(q.field("userId"), args.userId)).first();

        if (!user) {
            console.log("User not found for userId:", args.userId);
            return null;
        }

        return user;

    }
})

export const upgradeToPro = mutation({
    args: {
        email: v.string(),
          lemonSqueezyCustomerId: v.string(),
          lemonSqueezyOrderId: v.string(),
          amount: v.string(),
    },

    handler: async(ctx, args) => {
        const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

        if(!user) {
            return new Error("No such user exists");
        }

        await ctx.db.patch(user._id, {
            isPro: true,
            proSince: Date.now(),
            lemonSqueezyCustomerId: args.lemonSqueezyCustomerId,
            lemonSqueezyOrderId: args.lemonSqueezyOrderId,
        });
        
        return {success: true};
    }
})