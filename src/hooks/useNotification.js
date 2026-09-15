import { useContext } from "react";

import { NotificationContext }
from "../contexts/NotificationContext";

/**
 * Returns the notify API:
 *
 *   const notify = useNotification();
 *   notify.success("Saved!", "…");
 *   notify.error("Title", "…");
 *   notify.achievement("First memory!");
 *
 * Outside a provider this returns no-op
 * functions so a missing provider can
 * never crash a component.
 */
export default function useNotification() {
    const context = useContext(
        NotificationContext
    );

    return (
        context?.notify ?? {
            success: () => {},
            error: () => {},
            warning: () => {},
            info: () => {},
            achievement: () => {},
        }
    );

}
