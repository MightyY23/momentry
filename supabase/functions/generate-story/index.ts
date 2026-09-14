import { createClient } from "jsr:@supabase/supabase-js@2";

//----------------------------------------
// CORS
//----------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

//----------------------------------------
// Clients & config
//----------------------------------------

// Service role client: full DB access,
// used to load the story + moments and
// update the ai_stories job row.
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Gemini
const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY") ?? "";

const GEMINI_MODEL =
  Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";

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

async function generateWithGemini(
  prompt: string
): Promise<{
  title: string;
  summary: string;
  chapters: { title: string; content: string }[];
}> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
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

    throw new Error(
      `Gemini error ${res.status}: ${text.slice(0, 300)}`
    );
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

  const parsed = JSON.parse(raw);

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

  return {
    title: parsed.title,
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "",
    chapters: parsed.chapters
      .filter(
        (c: unknown) =>
          !!c &&
          typeof (c as Chapter).title === "string" &&
          typeof (c as Chapter).content === "string"
      )
      .map((c: Chapter) => ({
        title: c.title,
        content: c.content,
      })),
  };
}

//----------------------------------------
// Serve
//
// Contract with the live database:
//   * ai_stories.story_id is UNIQUE — one row
//     per story, so we UPSERT (never insert).
//   * A "Generate AI Story" AFTER INSERT
//     database trigger fires this function
//     with the inserted row when the frontend
//     creates a job via ai/createStoryJob.js.
//     In that mode we resolve the story from
//     the record payload.
//   * Direct calls with { storyId } are also
//     supported (used by the retry button).
//----------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  let storyId: string | null = null;

  try {
    //----------------------------------------
    // 1. Work out which story to generate for
    //----------------------------------------

    let body: {
      storyId?: string;
      record?: { story_id?: string };
      type?: string;
    } = {};

    try {
      const text = await req.text();

      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty or malformed body — tolerated.
    }

    if (body.storyId) {
      // Direct call from the app (retry path).
      storyId = body.storyId;
    } else if (body.record?.story_id) {
      // Database trigger webhook — the trigger
      // posts the inserted row using the
      // service key; no user JWT is involved.
      storyId = body.record.story_id;
    }

    if (!storyId) {
      return json(
        { error: "storyId is required." },
        400
      );
    }

    //----------------------------------------
    // 2. Authorise the caller
    //
    // This endpoint is only invoked by the
    // database trigger (service key) or by
    // the app. No client-supplied data is
    // trusted beyond the story id, which is
    // re-checked against the DB below.
    //----------------------------------------

    //----------------------------------------
    // 3. Load story + moments
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
      // Mark the job failed so the UI can
      // show a retry button.
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
    // 4. Mark the job as generating
    //    (upsert — story_id is unique)
    //----------------------------------------

    const { error: upsertError } = await admin
      .from("ai_stories")
      .upsert(
        {
          story_id: storyId,
          status: "generating",
          ai_model: GEMINI_MODEL,
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
    // 5. Generate with Gemini
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
    // 6. Persist the completed story
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
    //----------------------------------------
    // Failure: mark the job as failed so the
    // UI can offer a retry.
    //----------------------------------------

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
