import { useEffect, useState } from "react";

function useInfluencerSidebarWidth(pageRef: React.RefObject<HTMLDivElement>) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const update = () => {
      if (pageRef.current) {
        setOffset(pageRef.current.getBoundingClientRect().left);
      }
    };

    update();

    // Catch window resize
    window.addEventListener("resize", update);

    // Catch sidebar CSS transitions finishing
    document.addEventListener("transitionend", update);

    // Catch class/style changes on any element (sidebar toggle changes a class)
    const mo = new MutationObserver(update);
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
      subtree: true,
    });

    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("transitionend", update);
      mo.disconnect();
    };
  }, [pageRef]);

  return offset;
}

export default useInfluencerSidebarWidth