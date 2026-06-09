/** Scroll to a public landing section and keep the URL clean (no hash fragments). */
export function scrollToPublicSection(sectionId: string, behavior: ScrollBehavior = "smooth") {
  if (sectionId === "home") {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior, block: "start" });
  }
}

export function cleanHomeUrl() {
  if (window.location.pathname === "/" && window.location.hash) {
    window.history.replaceState(null, "", "/");
  }
}