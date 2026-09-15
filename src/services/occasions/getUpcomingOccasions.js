import { supabase } from "../supabase/supabaseClient";

/**
 * Upcoming occasions for the signed-in user's
 * story — birthdays (own + co-members) and the
 * story anniversary. Returns occasions within
 * `withinDays` (default 30), soonest first.
 *
 * Each occasion:
 *   { kind, label, name, date (ISO date of the
 *     next occurrence), daysUntil, isToday }
 */

function daysUntilNext(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Next occurrence of this month/day.
  const thisYear = new Date(
    today.getFullYear(),
    dateStr.month,
    dateStr.day
  );

  let next = thisYear;

  if (thisYear < today) {
    next = new Date(
      today.getFullYear() + 1,
      dateStr.month,
      dateStr.day
    );
  }

  const diffDays = Math.round(
    (next - today) / (1000 * 60 * 60 * 24)
  );

  return {
    daysUntil: diffDays,
    isToday: diffDays === 0,
    nextDate: next,
    // Age they'll turn (null when unknown year).
    turning:
      dateStr.year != null
        ? next.getFullYear() - dateStr.year
        : null,
  };
}

function parseISODate(iso) {
  // "2004-03-18" -> { year, month, day }
  if (!iso) return null;

  const [year, month, day] = iso
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month: month - 1, day };
}

export async function getUpcomingOccasions(
  withinDays = 30
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // My memberships -> my story.
  const { data: memberships } =
    await supabase
      .from("story_members")
      .select("story_id")
      .eq("user_id", user.id);

  const storyId = memberships?.[0]?.story_id;

  if (!storyId) return [];

  // Co-members' profiles + the story's anniversary.
  const [
    { data: memberRows },
    { data: story },
  ] = await Promise.all([
    supabase
      .from("story_members")
      .select(
        "user_id, profiles ( full_name, birth_date )"
      )
      .eq("story_id", storyId),
    supabase
      .from("stories")
      .select("anniversary_date, created_at")
      .eq("id", storyId)
      .maybeSingle(),
  ]);

  const occasions = [];

  //---------------------------------------
  // Birthdays (everyone in the story)
  //---------------------------------------

  for (const row of memberRows ?? []) {
    const profile = row?.profiles;

    if (!profile?.birth_date) continue;

    const parsed = parseISODate(
      profile.birth_date
    );

    const info = daysUntilNext(parsed);

    if (!info || info.daysUntil > withinDays) {
      continue;
    }

    const isMe = row.user_id === user.id;

    occasions.push({
      kind: "birthday",
      label: isMe
        ? "Your birthday"
        : `${profile.full_name || "Your partner"}'s birthday`,
      name: profile.full_name || null,
      isMe,
      userId: row.user_id,
      date: info.nextDate.toISOString(),
      daysUntil: info.daysUntil,
      isToday: info.isToday,
      turning: info.turning,
    });
  }

  //---------------------------------------
  // Anniversary
  //---------------------------------------

  const anniversary =
    story?.anniversary_date ||
    // Fall back to the story's creation day —
    // every couple remembers when it started.
    (story?.created_at
      ? story.created_at.slice(0, 10)
      : null);

  const annParsed = parseISODate(anniversary);

  const annInfo = daysUntilNext(annParsed);

  if (annInfo && annInfo.daysUntil <= withinDays) {
    // Gifts for the anniversary are addressed
    // to the co-member (or myself when I'm
    // alone — the composer disables those).
    const partner =
      (memberRows ?? []).find(
        (m) => m.user_id !== user.id
      ) ?? null;

    occasions.push({
      kind: "anniversary",
      label: "Your anniversary",
      name: null,
      isMe: false,
      userId: partner?.user_id ?? user.id,
      date: annInfo.nextDate.toISOString(),
      daysUntil: annInfo.daysUntil,
      isToday: annInfo.isToday,
      turning: annInfo.turning,
    });
  }

  return occasions.sort(
    (a, b) => a.daysUntil - b.daysUntil
  );
}
