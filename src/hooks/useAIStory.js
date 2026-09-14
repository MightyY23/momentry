import { useEffect, useRef, useState } from "react";

import { getAIStory } from "../services/ai/getStory";

/**
 * Polls the latest ai_stories row for a
 * story while it is pending/generating,
 * then stops. Used by the StoryBook page.
 */
export default function useAIStory(storyId) {
  const [aiStory, setAIStory] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!storyId) {
        setAIStory(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await getAIStory(
          storyId
        );

        if (cancelled) return;

        setAIStory(data);

        const busy =
          data?.status === "pending" ||
          data?.status === "generating";

        setGenerating(!!busy);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  //---------------------------------------
  // Poll while generating
  //---------------------------------------

  useEffect(() => {
    if (!generating || !storyId) {
      return undefined;
    }

    timerRef.current = setInterval(
      async () => {
        try {
          const data = await getAIStory(
            storyId
          );

          setAIStory(data);

          const busy =
            data?.status === "pending" ||
            data?.status === "generating";

          if (!busy) {
            setGenerating(false);
          }
        } catch (err) {
          console.error(
            "AI poll failed:",
            err
          );
        }
      },
      3000
    );

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [generating, storyId]);

  return {
    aiStory,
    loading,
    generating,
    refetch: () => {
      setGenerating(true);
    },
  };
}
