import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash) return;
    if (navigationType === "POP") return;

    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      // jsdom does not implement window.scrollTo in test environments.
    }
  }, [pathname, hash, navigationType]);

  return null;
}
