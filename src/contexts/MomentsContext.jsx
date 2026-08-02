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
    id
  ) {
    return await deleteMoment(id);
  }

  //---------------------------------------
  // Favorite
  //---------------------------------------

  async function favoriteMoment(
    id
  ) {
    return await toggleFavorite(id);
  }

  //---------------------------------------
  // Initial Load + Realtime
  //---------------------------------------

  useEffect(() => {
    refresh();

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