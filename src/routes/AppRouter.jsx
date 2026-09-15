import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import PublicRoute from "../components/PublicRoute/PublicRoute";
import Loader from "../ui/Loader/Loader";

//----------------------------------------
// Light, always-needed pages
//----------------------------------------

import Welcome from "../pages/Welcome/Welcome";
import StoryIntro from "../pages/StoryIntro/StoryIntro";
import Auth from "../pages/Auth/Auth";
import Home from "../pages/Home/Home";
import CreateStory from "../pages/CreateStory/CreateStory";
import InvitePartner from "../pages/InvitePartner/InvitePartner";
import AddMoment from "../pages/AddMoment/AddMoment";
import ViewMoment from "../pages/ViewMoment/ViewMoment";
import EditMoment from "../pages/EditMoment/EditMoment";
import AcceptInvitation from "../pages/AcceptInvitation/AcceptInvitation";
import Onboarding from "../pages/Onboarding/Onboarding";
import Profile from "../pages/Profile/Profile";

//----------------------------------------
// Heavy pages — lazy loaded
// (Leaflet map, charts, gallery, AI
// StoryBook, sharing, calendar, search)
//----------------------------------------

const MemoryMap = lazy(() =>
  import("../pages/MemoryMap/MemoryMap")
);
const StoryBook = lazy(() =>
  import("../pages/StoryBook/StoryBook")
);
const Analytics = lazy(() =>
  import("../pages/Analytics/Analytics")
);
const Gallery = lazy(() =>
  import("../pages/Gallery/Gallery")
);
const Calendar = lazy(() =>
  import("../pages/Calendar/Calendar")
);
const Search = lazy(() =>
  import("../pages/Search/Search")
);
const Settings = lazy(() =>
  import("../pages/Settings/Settings")
);
const SharedStory = lazy(() =>
  import("../pages/SharedStory/SharedStory")
);
const NotFound = lazy(() =>
  import("../pages/NotFound/NotFound")
);

function AppRouter() {
  return (
    <Suspense
      fallback={<Loader label="Loading page…" />}
    >
      <Routes>
        {/* ------------------------------------
            Public
        ------------------------------------ */}

        <Route path="/" element={<Welcome />} />

        <Route
          path="/story-introduction"
          element={<StoryIntro />}
        />

        <Route
          path="/share/:shareCode"
          element={<SharedStory />}
        />

        {/* Guest-only */}

        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        {/* Supabase password-recovery
            redirect target */}

        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <Auth resetMode />
            </PublicRoute>
          }
        />

        {/* ------------------------------------
            Private
        ------------------------------------ */}

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-story"
          element={
            <ProtectedRoute>
              <CreateStory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invite-partner"
          element={
            <ProtectedRoute>
              <InvitePartner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-moment"
          element={
            <ProtectedRoute>
              <AddMoment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/moment/:id"
          element={
            <ProtectedRoute>
              <ViewMoment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-moment/:id"
          element={
            <ProtectedRoute>
              <EditMoment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/accept-invitation"
          element={
            <ProtectedRoute>
              <AcceptInvitation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/storybook"
          element={
            <ProtectedRoute>
              <StoryBook />
            </ProtectedRoute>
          }
        />

        <Route
          path="/memory-map"
          element={
            <ProtectedRoute>
              <MemoryMap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        {/* ------------------------------------
            Catch-all
        ------------------------------------ */}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
