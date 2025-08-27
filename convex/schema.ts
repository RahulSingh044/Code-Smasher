import { error } from "console";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { output } from "framer-motion/client";

export default defineSchema({
    users: defineTable({
        userId: v.string(),
        email: v.string(),
        name: v.string(),
        isPro: v.boolean(),
        proSince: v.optional(v.number()),
        lemonSqueezyCustomerId: v.optional(v.string()),
        lemonSqueezyOrderId: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_user_id", ["userId"]),

    codeExecutions: defineTable({
        userId: v.string(),
        language: v.string(),
        code: v.string(),
        output: v.optional(v.string()),
        error: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_user_id", ["userId"]),

    snippets: defineTable({
        userId: v.string(),
        title: v.string(),
        language: v.string(),
        code: v.string(),
        username: v.string(),
        createdAt: v.number(),
    }).index("by_user_id", ["userId"]),

    snippetsComments: defineTable({
        snippetId: v.id("snippets"),
        userId: v.string(),
        content: v.string(),
        username: v.string(),
        createdAt: v.number(),
    }).index("by_snippet_id", ["snippetId"]),

    snippetsStar: defineTable({
        snippetId: v.id("snippets"),
        userId: v.string(),
    }).index("by_snippet_id", ["snippetId"])
        .index("by_user_id", ["userId"])
        .index("by_snippet_user_id", ["snippetId", "userId"]),
})