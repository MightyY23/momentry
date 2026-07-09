import { Routes, Route } from "react-router-dom";

import Welcome from "../pages/Welcome/Welcome";
import StoryIntro from "../pages/StoryIntro/StoryIntro";
import Auth from "../pages/Auth/Auth";
import CreateStory from "../pages/CreateStory/CreateStory";
import InvitePartner from "../pages/InvitePartner/InvitePartner";
import Home from "../pages/Home/Home";
import AddMoment from "../pages/AddMoment/AddMoment";

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
        element={<Home />}
       />

      <Route
        path="/create-story"
        element={<CreateStory />}
      />

      <Route
        path="/add-moment"
        element={<AddMoment />}
       />

    </Routes>
  );
}

export default AppRouter;