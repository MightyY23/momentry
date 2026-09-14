import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "../services/supabase/supabaseClient";

import { getMyStory } from "../services/story/getStory";
import { getMoments } from "../services/moment/getMoments";

import { createMoment } from "../services/moment/momentService";
import { updateMoment } from "../services/moment/updateMoment";
import { deleteMoment } from "../services/moment/deleteMoment";
import { toggleFavorite } from "../services/moment/toggleFavorite";

export const MomentsContext =
  createContext(null);

export function MomentsProvider({
  children,
}) {
  //---------------------------------------
  // State
  //---------------------------------------

  const [story, setStory] =
    useState(null);

  const [moments, setMoments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  //---------------------------------------
  // Refresh
  //---------------------------------------

  const refresh =
    useCallback(async () => {
      try {
        setLoading(true);

        // Logged out (e.g. on the landing page):
        // clear state quietly instead of letting
        // getMyStory throw into the console.
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setStory(null);
          setMoments([]);
          return;
        }

        const storyData =
          await getMyStory();

        setStory(storyData);

        if (!storyData) {
          setMoments([]);
          return;
        }

        const data =
          await getMoments(
            storyData.id
          );

        setMoments(data || []);
      } catch (err) {
        console.error(
          "MomentsContext:",
          err
        );
      } finally {
        setLoading(false);
      }
    }, []);

  //---------------------------------------
  // Add Moment
  //---------------------------------------

  async function addMoment(
    moment
  ) {
    return await createMoment(
      moment
    );
  }

  //---------------------------------------
  // Edit Moment
  //---------------------------------------

  async function editMoment(
    id,
    updates
  ) {
    return await updateMoment(
      id,
      updates
    );
  }

  //---------------------------------------
  // Delete Moment
  //---------------------------------------

  async function removeMoment(
    moment
  ) {
    // deleteMoment needs the moment OBJECT
    // (to clean up its storage file), not
    // just the id.
    const target =
      typeof moment === "string"
        ? moments.find((m) => m.id === moment)
        : moment;

    if (!target) {
      throw new Error(
        "Memory not found — it may already be deleted."
      );
    }

    return await deleteMoment(target);
  }

  //---------------------------------------
  // Favorite
  //---------------------------------------

  async function favoriteMoment(
    momentOrId
  ) {
    // Resolve the CURRENT favorite state so
    // toggling works in both directions.
    const target =
      typeof momentOrId === "string"
        ? moments.find((m) => m.id === momentOrId)
        : momentOrId;

    if (!target) {
      throw new Error("Memory not found.");
    }

    return await toggleFavorite(
      target.id,
      target.is_favorite
    );
  }

  //---------------------------------------
  // Initial Load + Realtime
  //---------------------------------------

  useEffect(() => {
    // The initial load runs in a microtask
    // callback so no setState happens
    // synchronously inside the effect body.
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        refresh();
      }
    });

    const channel = supabase
      .channel("moments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "moments",
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;

      supabase.removeChannel(
        channel
      );
    };
  }, [refresh]);

  //---------------------------------------

  return (
    <MomentsContext.Provider
      value={{
        //-----------------------------------
        // Global Data
        //-----------------------------------

        story,
        moments,
        loading,

        //-----------------------------------
        // Actions
        //-----------------------------------

        refresh,

        addMoment,
        editMoment,
        removeMoment,
        favoriteMoment,

        //-----------------------------------
        // Advanced
        //-----------------------------------

        setStory,
        setMoments,
      }}
    >
      {children}
    </MomentsContext.Provider>
  );
}