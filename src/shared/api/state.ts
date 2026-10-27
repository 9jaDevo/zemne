/**
 * State machines. The server is the only authority on status; clients request
 * a target state and the server checks it against these tables.
 */
import type { ContributionStatus, ModerationDecision, StoryStatus } from "./schemas";

/**
 * Guestbook entries and tributes. `pending` is entry-only (set by submission);
 * nothing ever returns to `pending`. approved <-> rejected lets the organizer
 * remove published content or reconsider a rejection.
 */
export const CONTRIBUTION_TRANSITIONS: Readonly<Record<ContributionStatus, readonly ModerationDecision[]>> = {
  pending: ["approved", "rejected"],
  approved: ["rejected"],
  rejected: ["approved"],
};

/** Same-state requests are idempotent no-ops (200 with the unchanged item). */
export function canModerate(from: ContributionStatus, to: ModerationDecision): boolean {
  return from === to || CONTRIBUTION_TRANSITIONS[from].includes(to);
}

export type StoryAction = "edit" | "publish" | "unpublish";

/**
 * Stories. At most one story per memorial is `published`; publishing another
 * returns the previous one to `draft`. Editing is allowed in both states and a
 * published edit is live immediately (the organizer is the reviewer).
 */
export const STORY_ACTIONS: Readonly<Record<StoryStatus, readonly StoryAction[]>> = {
  draft: ["edit", "publish"],
  published: ["edit", "unpublish"],
};

export function canApplyStoryAction(from: StoryStatus, action: StoryAction): boolean {
  return STORY_ACTIONS[from].includes(action);
}

export function storyStatusAfter(from: StoryStatus, action: StoryAction): StoryStatus {
  if (!canApplyStoryAction(from, action)) {
    throw new Error(`Story action "${action}" is not allowed from "${from}"`);
  }
  if (action === "publish") return "published";
  if (action === "unpublish") return "draft";
  return from;
}
