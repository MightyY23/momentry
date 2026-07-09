import { Routes, Route } from "react-router-dom";

import Welcome from "../pages/Welcome/Welcome";
import StoryIntro from "../pages/StoryIntro/StoryIntro";
import Auth from "../pages/Auth/Auth";
import CreateStory from "../pages/CreateStory/CreateStory";
import InvitePartner from "../pages/InvitePartner/InvitePartner";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />

      <Route
        path="/story-introduction"
        element={<StoryIntro />}
      />

      <Route
        path="/auth"
        element={<Auth />}
      />

      <Route
        path="/invite-partner"
        element={<InvitePartner />}
       />

       <Route
        path="/home"
        element={<h1 style={{ padding: "2rem" }}>🏠 Home Coming Soon</h1>}
       />

      <Route
        path="/create-story"
        element={<CreateStory />}
      />
    </Routes>
  );
}

export default AppRouter;