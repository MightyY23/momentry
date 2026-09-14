import { createClient } from "jsr:@supabase/supabase-js@2";

//----------------------------------------
// Delete Account — edge function
//
// Fully removes a user account and every
// dependent artifact:
//   1. auth user verification (JWT)
//   2. storage objects (avatars, moment images)
//   3. owned stories (moments, ai_stories,
//      shares, members cascade via FK)
//   4. invitations sent by the user
//   5. story_members rows (collaborations)
//   6. auth user itself
//
// The client passes the user's access token;
// we NEVER accept a user id in the body.
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function extractToken(req: Request): string | null {
  const header =
    req.headers.get("Authorization") ?? "";

  const match = header.match(/^Bearer (.+)$/);

  return match ? match[1] : null;
}

async function pathExists(path: string): Promise<boolean> {
  const { data } = await admin.storage
    .from("moments")
    .list(path, { limit: 1 });

  return (data?.length ?? 0) > 0;
}

async function removeStoragePrefix(
  bucket: string,
  prefix: string
): Promise<void> {
  // List everything under the user prefix and
  // remove it in batches.
  let offset = 0;

  const limit = 100;

  for (;;) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });

    if (error) {
      console.error(`list ${bucket}/${prefix}:`, error.message);
      break;
    }

    const files = (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");

    if (files.length === 0) break;

    const paths = files.map((f) => `${prefix}/${f.name}`);

    const { error: removeError } = await admin.storage
      .from(bucket)
      .remove(paths);

    if (removeError) {
      console.error(
        `remove ${bucket}:`,
        removeError.message
      );
    }

    if (files.length < limit) break;

    offset += limit;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    //----------------------------------------
    // 1. Identify the caller from their JWT
    //----------------------------------------

    const token = extractToken(req);

    if (!token) {
      return json(
        { error: "Missing access token." },
        401
      );
    }

    const { data: userData, error: userError } =
      await admin.auth.getUser(token);

    if (userError || !userData?.user) {
      return json(
        { error: "Invalid or expired token." },
        401
      );
    }

    const userId = userData.user.id;

    const { data: profile } = await admin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    console.log(
      `Deleting account ${userId}…`
    );

    //----------------------------------------
    // 2. Storage cleanup — avatars
    //----------------------------------------

    const avatarUrl: string | null =
      profile?.avatar_url ?? null;

    if (avatarUrl) {
      const match = avatarUrl.match(
        /\/object\/(?:public|authenticated)\/avatars\/(.+)$/
      );

      const avatarPath = match
        ? decodeURIComponent(match[1])
        : null;

      if (avatarPath) {
        const { error } = await admin.storage
          .from("avatars")
          .remove([avatarPath]);

        if (error) {
          console.error(
            "avatar remove:",
            error.message
          );
        }
      }
    }

    //----------------------------------------
    // 3. Storage cleanup — moment images
    //    from stories the user owns
    //----------------------------------------

    const { data: ownedStories } = await admin
      .from("stories")
      .select("id")
      .eq("owner_id", userId);

    const ownedIds = (ownedStories ?? []).map(
      (s) => s.id
    );

    if (ownedIds.length > 0) {
      const { data: images } = await admin
        .from("moments")
        .select("image_url")
        .in("story_id", ownedIds)
        .not("image_url", "is", null);

      const paths = new Set<string>();

      for (const row of images ?? []) {
        const match = (row.image_url as string).match(
          /\/object\/(?:public|authenticated)\/moments\/(.+)$/
        );

        if (match) {
          paths.add(
            decodeURIComponent(match[1])
          );
        }
      }

      // Also sweep any leftovers under the
      // user's storage folder.
      if (await pathExists(userId)) {
        await removeStoragePrefix(
          "moments",
          userId
        );
      }

      if (paths.size > 0) {
        const { error } = await admin.storage
          .from("moments")
          .remove([...paths]);

        if (error) {
          console.error(
            "moment images remove:",
            error.message
          );
        }
      }
    }

    //----------------------------------------
    // 4. Delete owned stories
    //    (moments, ai_stories, shared_stories,
    //    story_members cascade via FK)
    //----------------------------------------

    if (ownedIds.length > 0) {
      const { error } = await admin
        .from("stories")
        .delete()
        .in("id", ownedIds);

      if (error) {
        throw new Error(
          `Could not delete owned stories: ${error.message}`
        );
      }
    }

    //----------------------------------------
    // 5. Invitations the user sent or received
    //    (accepting members reference them)
    //----------------------------------------

    await admin
      .from("invitations")
      .delete()
      .or(
        `invited_by.eq.${userId},email.eq.${userData.user.email}`
      );

    //----------------------------------------
    // 6. Memberships in other people's stories
    //----------------------------------------

    await admin
      .from("story_members")
      .delete()
      .eq("user_id", userId);

    //----------------------------------------
    // 7. Profile row
    //----------------------------------------

    await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    //----------------------------------------
    // 8. Delete the auth user
    //    (anonymized content they added to
    //    other stories remains — FK sets
    //    created_by null where supported)
    //----------------------------------------

    const { error: deleteError } =
      await admin.auth.deleteUser(userId);

    if (deleteError) {
      throw new Error(
        `Could not delete auth user: ${deleteError.message}`
      );
    }

    return json({
      success: true,
      message:
        "Account and all associated data deleted.",
    });
  } catch (e) {
    const message = e instanceof Error
      ? e.message
      : String(e);

    console.error("delete-account failed:", message);

    return json({ error: message }, 500);
  }
});
