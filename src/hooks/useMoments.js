import { useContext } from "react";

import {
  MomentsContext,
} from "../contexts/MomentsContext";

export default function useMoments() {
  return useContext(
    MomentsContext
  );
}