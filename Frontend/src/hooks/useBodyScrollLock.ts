import { useEffect } from "react";

let activeLocksCount = 0;
let originalOverflow = "";

export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    if (activeLocksCount === 0) {
      // Save original body overflow style
      originalOverflow = document.body.style.overflow || "";

      // Lock scroll
      document.body.style.overflow = "hidden";
    }

    activeLocksCount++;

    return () => {
      activeLocksCount--;

      if (activeLocksCount === 0) {
        // Restore body overflow style
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isOpen]);
}
export default useBodyScrollLock;
