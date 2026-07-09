import { Routes, Route } from "react-router-dom";

import Welcome from "../pages/Welcome/Welcome";
import StoryIntro from "../pages/StoryIntro/StoryIntro";
import CreateStory from "../pages/CreateStory/CreateStory";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />

      <Route
        path="/story-introduction"
        element={<StoryIntro />}
      />

      <Route
        path="/create-story"
        element={<CreateStory />}
      />
    </Routes>
  );
}

export default AppRouter;