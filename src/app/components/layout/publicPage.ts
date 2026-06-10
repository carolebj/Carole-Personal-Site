/** Shared layout classes for public pages (fixed nav clearance + shell). */

/** Standard page shell below the fixed header — `pt-28 md:pt-36`. */
export const PAGE_MAIN =
  "min-h-[70vh] bg-surface-page px-5 pb-20 pt-28 text-text-primary sm:px-8 md:pt-36 lg:px-8";

/** Same top offset with extra bottom padding (contact, carnet). */
export const PAGE_MAIN_SPACIOUS =
  "min-h-[70vh] bg-surface-page px-5 pb-28 pt-28 text-text-primary sm:px-8 md:pt-36 lg:px-8";

/** In-page anchor offset matching PAGE_MAIN top padding. */
export const PAGE_SCROLL_MARGIN = "scroll-mt-28 md:scroll-mt-36";

/** Section vertical rhythm (portfolio pages). */
export const SECTION_PY = "px-5 py-16 sm:px-8 lg:py-24";
