export function getContactFieldError(
  element: HTMLInputElement | HTMLTextAreaElement,
  translate: (key: string) => string,
): string {
  const { validity, name, type } = element;

  if (validity.valueMissing) {
    if (name === "name") return translate("contactSection.errors.nameRequired");
    if (name === "email") return translate("contactSection.errors.emailRequired");
    if (name === "message") return translate("contactSection.errors.messageRequired");
    return translate("contactSection.errors.nameRequired");
  }

  if ((validity.typeMismatch || validity.badInput) && type === "email") {
    return translate("contactSection.errors.emailInvalid");
  }

  if (name === "email") {
    return translate("contactSection.errors.emailInvalid");
  }
  if (name === "message") {
    return translate("contactSection.errors.messageRequired");
  }
  if (name === "name") {
    return translate("contactSection.errors.nameRequired");
  }

  return translate("contactSection.errors.messageRequired");
}

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
