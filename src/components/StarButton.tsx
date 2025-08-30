import { useAuth } from "@clerk/nextjs";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Star } from "lucide-react";

function StarButton({ snippetId }: { snippetId: Id<"snippets"> }) {
  const { isSignedIn } = useAuth();

  const state = useQuery(api.snippets.getSnippetStarState, { snippetId });
  const starSnippet = useMutation(api.snippets.starSnippet);

  const handleStar = async () => {
    if (!isSignedIn) return;
    await starSnippet({ snippetId });
  };

  if (!state) return null; // still loading

  return (
    <button
      disabled={!isSignedIn}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200
        ${state.alreadyStarred
          ? "bg-yellow-500/10 text-yellow-500 cursor-default"
          : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"}
      `}
      onClick={handleStar}
    >
      <Star
        className={`w-4 h-4 ${
          state.alreadyStarred
            ? "fill-yellow-500"
            : "fill-none group-hover:fill-gray-400"
        }`}
      />
      <span
        className={`text-xs font-medium ${
          state.alreadyStarred ? "text-yellow-500" : "text-gray-400"
        }`}
      >
        {state.count}
      </span>
    </button>
  );
}

export default StarButton;
