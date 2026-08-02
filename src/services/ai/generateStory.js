import { supabase } from "../supabase/supabaseClient";

export async function generateStory(story, moments) {
  const payload = {
    storyTitle: story.title,
    moments: moments.map((moment) => ({
      title: moment.title,
      description: moment.description,
      date: moment.memory_date,
    })),
  };

  const { data, error } = await supabase.functions.invoke(
    "generate-story",
    {
      body: payload,
    }
  );

  console.log("Function Data:", data);
  console.log("Function Error:", error);

  if (error) {
    console.error("Full Error:", error);

    try {
      if (error.context) {
        const body = await error.context.text();
        console.error("Function Body:", body);
      }
    } catch (e) {
      console.error("Couldn't read body", e);
    }

    throw error;
  }

  return data.story;
}