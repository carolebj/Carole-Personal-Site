export function getTransitionDurationMs(name: string, fallback: number) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name)
  );
  return Number.isFinite(value) ? value : fallback;
}

export function shakeInvalidField(
  firstInvalid: HTMLInputElement | HTMLTextAreaElement | undefined
) {
  if (!firstInvalid) {
    return;
  }

  const shakeMs =
    getTransitionDurationMs("--shake-dur-a", 80) * 2 +
    getTransitionDurationMs("--shake-dur-b", 60) * 2;

  firstInvalid.classList.remove("is-shaking");
  void firstInvalid.offsetWidth;
  firstInvalid.classList.add("is-shaking");
  window.setTimeout(() => firstInvalid.classList.remove("is-shaking"), shakeMs + 20);
  firstInvalid.focus();
}
