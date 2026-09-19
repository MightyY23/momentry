import { createClient } from "jsr:@supabase/supabase-js@2";

//----------------------------------------
// GENERATE STORY — Edge Function
//
// POST { storyId } with the caller's Supabase
// JWT. The caller must be a member of the
// story. Loads the story's moments, asks
// Gemini for a structured storybook, and
// writes the result to ai_stories.
//
// Deployed with verify_jwt: true — the
// platform rejects requests without a valid
// token before this code runs.
//----------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY") ?? "";

// Fallback chain: if the configured model is
// unavailable/unknown (404/400), walk down
// until one answers. A wrong model id can
// never 500 the whole job again.
const MODEL_CHAIN = [
  Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
].filter((m, i, arr) => m && arr.indexOf(m) === i);

//----------------------------------------
// Types
//----------------------------------------

interface Chapter {
  title: string;
  content: string;
  image_url?: string | null;
  location?: string | null;
  memory_date?: string | null;
  is_favorite?: boolean;
}

interface MomentRow {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  image_url: string | null;
  location: string | null;
  is_favorite: boolean | null;
}

//----------------------------------------
// Helpers
//----------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function storyPrompt(
  storyTitle: string,
  moments: MomentRow[]
): string {
  const momentList = moments
    .map((m, i) => {
      const bits = [
        `${i + 1}. "${m.title}"`,
        m.memory_date ? `date: ${m.memory_date}` : "",
        m.location ? `place: ${m.location}` : "",
        m.description ? `memory: ${m.description}` : "",
      ].filter(Boolean);

      return bits.join(" | ");
    })
    .join("\n");

  return `You are a warm, emotionally intelligent ghostwriter turning real memories into a beautiful storybook.

STORY TITLE: "${storyTitle}"

MEMORIES (chronological):
${momentList}

Write a narrative that:
- Feels personal, tender and cinematic — like a premium keepsake book.
- Uses the memories as inspiration, but elevates them into flowing prose (never list-like).
- Divides the story into 3 to 6 chapters, each with an evocative title and 80-150 words of narrative.
- If there are only a few memories, still produce at least 2 chapters.
- Never invent people, places or events that contradict the memories; poetic license for tone is fine.

Return ONLY valid JSON in exactly this shape (no markdown, no commentary):
{
  "title": "string — a beautiful book title inspired by the story",
  "summary": "string — one warm sentence describing the book",
  "chapters": [
    { "title": "string", "content": "string" }
  ]
}`;
}

// Strip markdown fences and grab the first
// JSON object — models sometimes wrap JSON
// in ```json blocks despite instructions.
function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end > start) {
      return JSON.parse(
        cleaned.slice(start, end + 1)
      );
    }

    throw new Error(
      "Gemini's response was not valid JSON."
    );
  }
}

async function callGeminiOnce(
  model: string,
  prompt: string
): Promise<{
  title: string;
  summary: string;
  chapters: { title: string; content: string }[];
}> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();

    // Caller decides whether to try the next
    // model (404/400/429) or abort (401/403).
    const err = new Error(
      `Gemini ${model} error ${res.status}: ${text.slice(0, 300)}`
    ) as Error & { status?: number };

    err.status = res.status;

    throw err;
  }

  const data = await res.json();

  const raw: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  if (!raw) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  const parsed = extractJson(raw) as {
    title?: unknown;
    summary?: unknown;
    chapters?: unknown;
  };

  if (
    !parsed ||
    typeof parsed.title !== "string" ||
    !Array.isArray(parsed.chapters) ||
    parsed.chapters.length === 0
  ) {
    throw new Error(
      "Gemini returned an unexpected story shape."
    );
  }

  const chapters = (parsed.chapters as Chapter[])
    .filter(
      (c) =>
        !!c &&
        typeof c.title === "string" &&
        typeof c.content === "string"
    )
    .map((c) => ({
      title: c.title,
      content: c.content,
    }));

  if (chapters.length === 0) {
    throw new Error(
      "Gemini's chapters were malformed."
    );
  }

  return {
    title: parsed.title,
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "",
    chapters,
  };
}

// Last resort: ask Gemini which models
// actually exist right now and pick a
// capable one. Model ids get retired over
// time — discovery keeps the feature
// working without code changes.
// `excluded` = models already tried and
// rejected (a model can be listed but
// blocked for newer API keys).
async function discoverModel(
  excluded: Set<string>
): Promise<string | null> {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        headers: {
          "x-goog-api-key": GEMINI_API_KEY,
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    const usable = (
      data?.models as Array<{
        name?: string;
        supportedGenerationMethods?: string[];
      }>
    )
      .filter(
        (m) =>
          !!m?.name &&
          m?.supportedGenerationMethods?.includes(
            "generateContent"
          )
      )
      .map((m) =>
        String(m.name).replace(/^models\//, "")
      )
      .filter((n) => !excluded.has(n));

    if (usable.length === 0) return null;

    // Prefer a stable flash tier model.
    const stableFlash = usable.find(
      (n) =>
        /flash/i.test(n) &&
        !/lite|exp|thinking|8b|preview/i.test(n)
    );

    const anyFlash = usable.find((n) =>
      /flash/i.test(n)
    );

    const pro = usable.find((n) => /pro/i.test(n));

    return stableFlash || anyFlash || pro || usable[0];
  } catch {
    return null;
  }
}

async function generateWithGemini(
  prompt: string
): Promise<{
  title: string;
  summary: string;
  chapters: { title: string; content: string }[];
}> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "The AI service isn't configured yet (missing GEMINI_API_KEY). Ask the app owner to set the Supabase secret."
    );
  }

  const tried = new Set<string>();

  const queue = [...MODEL_CHAIN];

  let lastError: unknown = null;

  while (queue.length > 0) {
    const model = queue.shift()!;

    if (tried.has(model)) continue;

    tried.add(model);

    try {
      return await callGeminiOnce(
        model,
        prompt
      );
    } catch (e) {
      lastError = e;

      const status = (e as { status?: number })
        .status;

      // Auth/key problems won't fix themselves
      // on the next model — abort immediately.
      if (status === 401 || status === 403) {
        throw e;
      }

      // Retirement notices often name the
      // replacement: "...use models/X instead".
      // Feed that model straight into the queue.
      const hint = /use models\/([a-z0-9.\-]+)/i
        .exec(
          (e as Error)?.message ?? ""
        )?.[1];

      if (hint && !tried.has(hint)) {
        queue.unshift(hint);
      }

      // 404 (bad model id), 400 (bad request for
      // that model), 429 (rate limit) → next one.
      continue;
    }
  }

  // Every known model failed — discover what
  // exists today (excluding tried ones) and
  // try that.
  const discovered = await discoverModel(tried);

  if (discovered && !tried.has(discovered)) {
    try {
      return await callGeminiOnce(
        discovered,
        prompt
      );
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError));
}

//----------------------------------------
// Auth: caller JWT → user id → membership
//----------------------------------------

async function authorize(
  req: Request,
  storyId: string
): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "")
    .replace(/^Bearer\s+/i, "");

  if (!token) return null;

  const authRes = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/auth/v1/user`,
    {
      headers: {
        apikey: Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        )!,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!authRes.ok) return null;

  const user = (await authRes.json()) as {
    id?: string;
  };

  if (!user.id) return null;

  const memRes = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/story_members?story_id=eq.${storyId}&user_id=eq.${user.id}&select=user_id`,
    {
      headers: {
        apikey: Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        )!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
    }
  );

  const members = (await memRes.json()) as Array<{
    user_id: string;
  }>;

  return members.length ? user.id : null;
}

//----------------------------------------
// Serve
//----------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  let storyId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));

    storyId =
      typeof body?.storyId === "string"
        ? body.storyId
        : null;

    if (!storyId) {
      return json(
        { error: "storyId is required." },
        400
      );
    }

    //----------------------------------------
    // 1. Authorise: valid member of the story
    //----------------------------------------

    const userId = await authorize(req, storyId);

    if (!userId) {
      return json(
        { error: "Not authorized for this story." },
        403
      );
    }

    //----------------------------------------
    // 2. Load story + moments
    //----------------------------------------

    const { data: story } = await admin
      .from("stories")
      .select("id, title")
      .eq("id", storyId)
      .single();

    if (!story) {
      return json(
        { error: "Story not found." },
        404
      );
    }

    const { data: moments } = await admin
      .from("moments")
      .select(
        "id, title, description, memory_date, image_url, location, is_favorite"
      )
      .eq("story_id", storyId)
      .order("memory_date", { ascending: true });

    const momentRows: MomentRow[] = moments ?? [];

    if (momentRows.length === 0) {
      await admin
        .from("ai_stories")
        .update({
          status: "failed",
          error_message:
            "Add at least one memory before generating your StoryBook.",
          completed_at: new Date().toISOString(),
        })
        .eq("story_id", storyId);

      return json(
        {
          error:
            "Add at least one memory before generating your StoryBook.",
        },
        400
      );
    }

    //----------------------------------------
    // 3. Mark generating (upsert — story_id is
    //    unique per migration 033)
    //----------------------------------------

    const { error: upsertError } = await admin
      .from("ai_stories")
      .upsert(
        {
          story_id: storyId,
          status: "generating",
          ai_model: MODEL_CHAIN[0],
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null,
        },
        { onConflict: "story_id" }
      );

    if (upsertError) {
      throw new Error(
        `Could not update ai_stories job: ${upsertError.message}`
      );
    }

    //----------------------------------------
    // 4. Generate with Gemini
    //----------------------------------------

    const generated = await generateWithGemini(
      storyPrompt(story.title, momentRows)
    );

    // Enrich chapters with their source moment
    // details so the reader can show images,
    // places, dates and favorites.
    const chapters: Chapter[] = generated.chapters.map(
      (chapter, index) => {
        const source = momentRows[index] ?? null;

        return {
          ...chapter,
          image_url: source?.image_url ?? null,
          location: source?.location ?? null,
          memory_date: source?.memory_date ?? null,
          is_favorite: source?.is_favorite ?? false,
        };
      }
    );

    //----------------------------------------
    // 5. Persist the completed story
    //----------------------------------------

    const { data: completed, error: updateError } =
      await admin
        .from("ai_stories")
        .update({
          status: "completed",
          title: generated.title,
          summary: generated.summary,
          content: {
            title: generated.title,
            summary: generated.summary,
            chapters,
          },
          completed_at: new Date().toISOString(),
        })
        .eq("story_id", storyId)
        .select()
        .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return json({ story: completed });
  } catch (e) {
    const message = e instanceof Error
      ? e.message
      : String(e);

    console.error("generate-story failed:", message);

    if (storyId) {
      await admin
        .from("ai_stories")
        .update({
          status: "failed",
          error_message: message.slice(0, 500),
          completed_at: new Date().toISOString(),
        })
        .eq("story_id", storyId);
    }

    return json({ error: message }, 500);
  }
});
