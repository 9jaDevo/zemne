/**
 * ============================================================================
 *  SYNTHETIC TEST DATA — NOT REAL PEOPLE, NOT REAL TESTIMONIALS
 * ============================================================================
 * "Elowen Marsh" and the three guest personas below are invented for ZEMNE
 * development, tests and the hackathon demo. Any resemblance to real persons
 * is coincidental. Never present this content as genuine memories, and never
 * ship it as production data. The organizer token below is a fake that only
 * the mock client accepts; a real server rejects it (its hash matches nothing).
 */
import { APP_PATHS, buildManagePath, makeErrorBody } from "../api";
import type {
  ApiErrorBody,
  CreateMemorialResponse,
  ErrorCode,
  GuestbookSubmissionRequest,
  OrganizerGuestbookEntry,
  OrganizerMemorial,
  OrganizerMemorialResponse,
  OrganizerTribute,
  PublicMemorialResponse,
  StoryView,
  TributeSubmissionRequest,
} from "../api";
import { ERROR_CODES } from "../api";

export const FIXTURE_NOTICE =
  "SYNTHETIC TEST DATA — fictional memorial and fictional contributors. Not real testimonials.";

const fid = (suffix: string) => "65d0" + suffix.padStart(20, "0");

export const DEMO_IDS = {
  memorial: fid("1"),
  guestbook: { guestA: fid("a1"), guestB: fid("a2"), guestC: fid("a3"), guestBDuplicate: fid("a4") },
  tributes: { guestA: fid("b1"), guestB: fid("b2"), guestC: fid("b3") },
  story: fid("c1"),
} as const;

export const DEMO_SLUG = "elowen-marsh-k7q2xm";

/** FAKE. Accepted only by the mock client. */
export const DEMO_ORGANIZER_TOKEN = "zmn_ot_" + "DEMO-ONLY-not-a-real-secret-".padEnd(43, "0");

export const DEMO_MANAGE_PATH = buildManagePath(DEMO_IDS.memorial, DEMO_ORGANIZER_TOKEN);

/** Three fictional guest personas, as the forms would submit them. */
export const demoPersonas: readonly {
  key: "guestA" | "guestB" | "guestC";
  label: string;
  guestbook: GuestbookSubmissionRequest;
  tribute: TributeSubmissionRequest;
}[] = [
  {
    key: "guestA",
    label: "Guest A — fictional former student",
    guestbook: {
      display_name: "Tomasz Reyes",
      message: "Thinking of your family today. Thank you for all those after-school lab sessions.",
      consent: true,
    },
    tribute: {
      contributor_name: "Tomasz Reyes",
      relationship: "Former student",
      content:
        "Mrs Marsh stayed after class every Thursday so anyone who was struggling could redo the experiments. She never made me feel slow. She used to say a mistake was just an experiment that wasn't finished yet. I became a pharmacist partly because of her patience.",
      consent: true,
    },
  },
  {
    key: "guestB",
    label: "Guest B — fictional neighbour",
    guestbook: {
      display_name: "Ngozi Achterberg",
      message: "Your tomatoes are still growing on our windowsill. We miss you.",
      consent: true,
    },
    tribute: {
      contributor_name: "Ngozi Achterberg",
      relationship: "Neighbour",
      content:
        "Every August Elowen left bags of tomatoes from her garden on the doorsteps along our street, with handwritten notes about which ones were best for soup. When my son was small she let him help water the beans and gave him his own little row to look after.",
      consent: true,
    },
  },
  {
    key: "guestC",
    label: "Guest C — fictional choir friend",
    guestbook: {
      display_name: "Priya Lindqvist",
      message: "Singing the alto line tonight for you, Elowen.",
      consent: true,
    },
    tribute: {
      contributor_name: "Priya Lindqvist",
      relationship: "Choir friend",
      content:
        "Elowen sat next to me in the community choir for years. She was always the first to arrive and would hum while she set out the chairs. When I lost my nerve before my first solo, she squeezed my hand and told me to sing to one person I loved. I still do.",
      consent: true,
    },
  },
];

const [personaA, personaB, personaC] = demoPersonas;

const demoMemorial: OrganizerMemorial = {
  id: DEMO_IDS.memorial,
  slug: DEMO_SLUG,
  guest_path: APP_PATHS.guest(DEMO_SLUG),
  name: "Elowen Marsh",
  birth_year: 1941,
  death_year: 2025,
  description:
    "Gardener, choir alto and retired chemistry teacher. This hall gathers memories from the people who knew her.",
  portrait: { kind: "placeholder", key: "neutral-1" },
  visibility: "unlisted",
  created_at: "2026-10-27T09:00:00.000Z",
  updated_at: "2026-10-27T11:45:00.000Z",
};

/** Newest first. Snapshot: A and B approved, C pending, one duplicate rejected. */
const demoGuestbook: OrganizerGuestbookEntry[] = [
  {
    id: DEMO_IDS.guestbook.guestC,
    display_name: personaC.guestbook.display_name,
    message: personaC.guestbook.message,
    status: "pending",
    moderation_hints: [],
    created_at: "2026-10-27T10:40:00.000Z",
    moderated_at: null,
  },
  {
    id: DEMO_IDS.guestbook.guestBDuplicate,
    display_name: personaB.guestbook.display_name,
    message: personaB.guestbook.message,
    status: "rejected",
    moderation_hints: ["duplicate_submission"],
    created_at: "2026-10-27T10:21:00.000Z",
    moderated_at: "2026-10-27T11:02:00.000Z",
  },
  {
    id: DEMO_IDS.guestbook.guestB,
    display_name: personaB.guestbook.display_name,
    message: personaB.guestbook.message,
    status: "approved",
    moderation_hints: [],
    created_at: "2026-10-27T10:20:00.000Z",
    moderated_at: "2026-10-27T11:01:00.000Z",
  },
  {
    id: DEMO_IDS.guestbook.guestA,
    display_name: personaA.guestbook.display_name,
    message: personaA.guestbook.message,
    status: "approved",
    moderation_hints: [],
    created_at: "2026-10-27T10:05:00.000Z",
    moderated_at: "2026-10-27T11:00:00.000Z",
  },
];

const tributeFrom = (
  id: string,
  persona: (typeof demoPersonas)[number],
  status: OrganizerTribute["status"],
  created_at: string,
  moderated_at: string | null,
): OrganizerTribute => ({
  id,
  contributor_name: persona.tribute.contributor_name,
  relationship: persona.tribute.relationship ?? null,
  content: persona.tribute.content,
  status,
  moderation_hints: [],
  created_at,
  moderated_at,
});

/** Newest first. A and B approved; C pending (so the weave/approve flow can be exercised). */
const demoTributes: OrganizerTribute[] = [
  tributeFrom(DEMO_IDS.tributes.guestC, personaC, "pending", "2026-10-27T10:42:00.000Z", null),
  tributeFrom(DEMO_IDS.tributes.guestB, personaB, "approved", "2026-10-27T10:23:00.000Z", "2026-10-27T11:03:00.000Z"),
  tributeFrom(DEMO_IDS.tributes.guestA, personaA, "approved", "2026-10-27T10:08:00.000Z", "2026-10-27T11:04:00.000Z"),
];

/**
 * Hand-written DEMO paragraphs, one per fixture tribute, phrased only from that
 * tribute's text. Used for the fixture story and by the mock weave. Not AI output.
 */
export const DEMO_WEAVE_PARAGRAPHS: Readonly<Record<string, string>> = {
  [DEMO_IDS.tributes.guestA]:
    "Those who learned from Elowen remember her patience. A former student recalls her staying after class on Thursdays so anyone struggling could redo the experiments, and her saying that a mistake was just an experiment that wasn't finished yet.",
  [DEMO_IDS.tributes.guestB]:
    "Her garden reached past her own fence. A neighbour remembers bags of tomatoes left each August on doorsteps along the street, with handwritten notes about which were best for soup, and a small row of beans she gave a young boy to look after.",
  [DEMO_IDS.tributes.guestC]:
    "In the community choir she was the first to arrive, humming as she set out the chairs. A fellow singer remembers Elowen squeezing her hand before a first solo and telling her to sing to one person she loved.",
};

const DEMO_AI = {
  model_id: "DEMO-FIXTURE (no model called)",
  provider_label: "DEMO data — hand-written fixture, not Gemma output",
} as const;

const demoStory: StoryView = {
  id: DEMO_IDS.story,
  memorial_id: DEMO_IDS.memorial,
  status: "published",
  version: 3,
  title: "[DEMO] Remembering Elowen",
  paragraphs: [
    { text: DEMO_WEAVE_PARAGRAPHS[DEMO_IDS.tributes.guestA], source_tribute_ids: [DEMO_IDS.tributes.guestA] },
    { text: DEMO_WEAVE_PARAGRAPHS[DEMO_IDS.tributes.guestB], source_tribute_ids: [DEMO_IDS.tributes.guestB] },
    {
      text: "Both memories describe time given freely, whether at a lab bench after school or in a garden row shared with a neighbour's child.",
      source_tribute_ids: [DEMO_IDS.tributes.guestA, DEMO_IDS.tributes.guestB],
    },
  ],
  flags: [
    {
      code: "insufficient_material",
      origin: "model",
      paragraph_index: null,
      message: "Only two approved tributes were available; the remembrance may feel thin.",
      source_tribute_ids: [],
    },
    {
      code: "uncertain_detail",
      origin: "model",
      paragraph_index: 2,
      message: "This closing sentence is an interpretation linking both tributes; confirm it reads as intended.",
      source_tribute_ids: [DEMO_IDS.tributes.guestA, DEMO_IDS.tributes.guestB],
    },
  ],
  input_tribute_ids: [DEMO_IDS.tributes.guestA, DEMO_IDS.tributes.guestB],
  ai: DEMO_AI,
  edited_by_organizer: true,
  created_at: "2026-10-27T11:30:00.000Z",
  updated_at: "2026-10-27T11:45:00.000Z",
  published_at: "2026-10-27T11:45:00.000Z",
};

// ---------------------------------------------------------------------------
// View derivation (mirrors the server's serializers for fixture data)
// ---------------------------------------------------------------------------

export interface DemoMemorialState {
  memorial: OrganizerMemorial;
  token: string;
  guestbook: OrganizerGuestbookEntry[];
  tributes: OrganizerTribute[];
  stories: StoryView[];
}

const countBy = (items: { status: "pending" | "approved" | "rejected" }[]) => ({
  pending: items.filter((i) => i.status === "pending").length,
  approved: items.filter((i) => i.status === "approved").length,
  rejected: items.filter((i) => i.status === "rejected").length,
});

export function toOrganizerResponse(state: DemoMemorialState): OrganizerMemorialResponse {
  const published = state.stories.find((s) => s.status === "published");
  return structuredClone({
    memorial: state.memorial,
    guestbook: state.guestbook,
    tributes: state.tributes,
    stories: state.stories.slice(0, 10),
    published_story_id: published?.id ?? null,
    counts: { guestbook: countBy(state.guestbook), tributes: countBy(state.tributes) },
  });
}

/** Public-safe projection: allowlisted fields, approved items only, published story only. */
export function toPublicResponse(state: DemoMemorialState): PublicMemorialResponse {
  const m = state.memorial;
  const published = state.stories.find((s) => s.status === "published");
  return structuredClone({
    memorial: {
      slug: m.slug,
      name: m.name,
      birth_year: m.birth_year,
      death_year: m.death_year,
      description: m.description,
      portrait: m.portrait,
      created_at: m.created_at,
    },
    guestbook: state.guestbook
      .filter((g) => g.status === "approved")
      .slice(0, 200)
      .map((g) => ({ id: g.id, display_name: g.display_name, message: g.message, created_at: g.created_at })),
    tributes: state.tributes
      .filter((t) => t.status === "approved")
      .slice(0, 200)
      .map((t) => ({
        id: t.id,
        contributor_name: t.contributor_name,
        relationship: t.relationship,
        content: t.content,
        created_at: t.created_at,
      })),
    story:
      published && published.published_at
        ? {
            id: published.id,
            title: published.title,
            paragraphs: published.paragraphs,
            edited_by_organizer: published.edited_by_organizer,
            ai: published.ai,
            published_at: published.published_at,
          }
        : null,
  });
}

export function createDemoState(): DemoMemorialState {
  return structuredClone({
    memorial: demoMemorial,
    token: DEMO_ORGANIZER_TOKEN,
    guestbook: demoGuestbook,
    tributes: demoTributes,
    stories: [demoStory],
  });
}

// ---------------------------------------------------------------------------
// Ready-made response fixtures for UI development
// ---------------------------------------------------------------------------

export const demoOrganizerMemorialResponse: OrganizerMemorialResponse = toOrganizerResponse(createDemoState());

export const demoPublicMemorialResponse: PublicMemorialResponse = toPublicResponse(createDemoState());

/** A freshly created memorial: nothing approved yet, no story (empty states). */
export const demoEmptyPublicMemorialResponse: PublicMemorialResponse = {
  memorial: { ...demoPublicMemorialResponse.memorial, portrait: null, birth_year: null, death_year: null },
  guestbook: [],
  tributes: [],
  story: null,
};

export const demoCreateMemorialResponse: CreateMemorialResponse = {
  memorial_id: DEMO_IDS.memorial,
  memorial: demoPublicMemorialResponse.memorial,
  guest_path: demoMemorial.guest_path,
  manage_path: DEMO_MANAGE_PATH,
  organizer_token: DEMO_ORGANIZER_TOKEN,
  session: { memorial_id: DEMO_IDS.memorial, expires_at: "2026-10-27T21:00:00.000Z" },
};

/** One example body per error code, for building error states. */
export const demoErrorExamples: Readonly<Record<ErrorCode, ApiErrorBody>> = Object.fromEntries(
  ERROR_CODES.map((code) => [
    code,
    makeErrorBody(code, {
      requestId: `demo-${code.toLowerCase()}`,
      ...(code === "RATE_LIMITED" ? { retryAfterSeconds: 60 } : {}),
      ...(code === "VALIDATION_FAILED"
        ? { fields: [{ path: "content", message: "Too small: expected string to have >=10 characters" }] }
        : {}),
    }),
  ]),
) as Record<ErrorCode, ApiErrorBody>;
