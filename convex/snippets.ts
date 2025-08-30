import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const createSnippet = mutation({
    args: {
        title: v.string(),
        language: v.string(),
        code: v.string(),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const user = await ctx.db.query("users").withIndex("by_user_id").filter((q) => q.eq(q.field("userId"), identity.subject)).first();

        if (!user) {
            throw new ConvexError("User not found");
        }

        const snippetId = await ctx.db.insert("snippets", {
            userId: identity.subject,
            createdAt: Date.now(),
            username: user.name,
            title: args.title,
            code: args.code,
            language: args.language,
        });

        return snippetId;
    }
})

export const deleteSnippet = mutation({
    args: { snippetId: v.id("snippets") },

    handler: async (ctx, args) => { 
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const snippet = await ctx.db.get(args.snippetId);
        if (!snippet) {
            throw new ConvexError("Snippet not found");
        }

        if(snippet.userId !== identity.subject) {
            throw new ConvexError("You are not authorized to delete this snippet");
        }

        const comments = await ctx.db.query("snippetsComments")
        .withIndex("by_snippet_id")
        .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
        .collect();

        for(const comment of comments) {
            await ctx.db.delete(comment._id);
        }

        const stars = await ctx.db.query("snippetsStar")
        .withIndex("by_snippet_id")
        .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
        .collect();

        for(const star of stars) {
            await ctx.db.delete(star._id);
        }
        // Finally delete the snippet
        await ctx.db.delete(args.snippetId);
    }
});

export const getSnippetStarState = query({
  args: { snippetId: v.id("snippets") },
  handler: async (ctx, { snippetId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      const count = await ctx.db.query("snippetsStar").withIndex("by_snippet_id", q => q.eq("snippetId", snippetId)).collect();
      return { count: count.length, alreadyStarred: false };
    }

    const stars = await ctx.db.query("snippetsStar").withIndex("by_snippet_id", q => q.eq("snippetId", snippetId)).collect();
    const alreadyStarred = stars.some(s => s.userId === identity.subject);

    return { count: stars.length, alreadyStarred };
  },
});

export const starSnippet = mutation({
  args: { snippetId: v.id("snippets") },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // Check if this user has already starred this snippet
    const existingStar = await ctx.db
      .query("snippetsStar")
      .withIndex("by_snippet_user_id")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("snippetId"), args.snippetId)
        )
      )
      .first();

    if (existingStar) {
      // Already starred → remove it (unstar)
      await ctx.db.delete(existingStar._id);
    } else {
      // Not starred yet → add star
      await ctx.db.insert("snippetsStar", {
        snippetId: args.snippetId,
        userId: identity.subject,
      });
    }

    // Always return latest star state
    const allStars = await ctx.db
      .query("snippetsStar")
      .withIndex("by_snippet_id")
      .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
      .collect();

    return {
      starred: !existingStar, // true = just starred, false = just unstarred
      count: allStars.length,
    };
  },
});




export const getAllSnippets = query({
    handler: async (ctx) => {
        const snippets = await ctx.db.query("snippets").order("desc").collect();
        return snippets;
    }
})

export const getSnippetByID = query({
    args: { snippetId: v.id("snippets") },
    handler: async (ctx, args) => {
        const snippet = await ctx.db.get(args.snippetId);
        if(!snippet) throw new Error("Snippet Not Fount");

        return snippet;
    }
})

export const addComments = mutation({
    args : {
        snippetId : v.id("snippets"),
        content: v.string(),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) {
            throw new Error("Not authorized");
        }

        const user = await ctx.db.query("users")
        .withIndex("by_user_id")
        .filter((q) => q.eq(q.field("userId"),  identity.subject))
        .first()

        if(!user) throw new Error("User not found");

        return await ctx.db.insert("snippetsComments", {
            snippetId: args.snippetId,
            userId: identity.subject,
            username: user.name,
            content: args.content,
            createdAt: Date.now()
        });

    }
})

export const deleteComment = mutation({
    args: {
        commentId: v.id("snippetsComments"),
    },

    handler: async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) {
            throw new Error("Not authorized");
        }

        const comment = await ctx.db.get(args.commentId);
        if(!comment) throw new Error("Comment Not found");

        if(comment.userId !== identity.subject) {
            throw new Error("Not authorized to delete the comment");
        }

        await ctx.db.delete(args.commentId);
    }
})

export const getComments = query({
    args: { snippetId: v.id("snippets") },
    handler: async(ctx, args) => {
        const comment = await ctx.db.query("snippetsComments")
        .withIndex("by_snippet_id")
        .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
        .order("desc")
        .collect();

        return comment;
    }
})

export const snippetStarred = query({
    args: {
        snippetId: v.id("snippets")
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) return false;

        const star = await ctx.db
        .query("snippetsStar")
        .withIndex("by_snippet_user_id")
        .filter((q) => q.eq(q.field("userId"), identity.subject) && q.eq(q.field("snippetId"), args.snippetId))
        .first();

        return !!star;

    }
})

export const getSnippetStarCount = query({
    args: { snippetId: v.id("snippets")},
    handler: async (ctx, args) => {
        const star = await ctx.db.query("snippetsStar")
        .withIndex("by_snippet_id")
        .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
        .collect();

        return star.length;
    }
})

export const getStarredSnippet = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) return [];

        const stars = await ctx.db
        .query("snippetsStar")
        .withIndex("by_user_id")
        .filter((q) => q.eq(q.field("userId"), identity.subject))
        .collect();

        const snippet = await Promise.all(stars.map((star) => ctx.db.get(star.snippetId)));
        return snippet.filter((snippet) => snippet != null);
    },
})