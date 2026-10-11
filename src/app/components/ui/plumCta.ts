/** Share only colour treatment; call sites retain geometry and native semantics. */
export function plumCtaClasses({ hover = true }: { hover?: boolean } = {}) {
  const colours = "bg-action-accent text-text-on-accent";
  return hover ? `${colours} hover:bg-action-accent-hover` : colours;
}
