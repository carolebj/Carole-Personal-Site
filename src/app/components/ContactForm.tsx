import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useId, useState, type FormHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { getContactFieldError, shakeInvalidField } from "./contactFormUtils";
import { isSuccessfulContactResponse } from "./contactResponse";

type ContactFormVariant = "embedded" | "page";

type ContactFormProps = {
  variant?: ContactFormVariant;
  className?: string;
  showTitle?: boolean;
  /** Extra attributes for panel transitions (`data-page-id`, `data-open`, etc.). */
  formProps?: FormHTMLAttributes<HTMLFormElement> & {
    "data-page-id"?: string;
    "data-open"?: string;
  };
};

const labelClass = "text-sm font-semibold text-text-secondary";
const errorBorder = "is-error border-destructive dark:border-[#ff8aa1]";
const defaultBorder = "border-border-subtle dark:border-white/10";
const inputBase =
  "t-input public-input border bg-surface-page text-text-primary dark:bg-white/5 dark:text-text-primary";

const FIELD_NAMES = ["name", "email", "subject", "message"] as const;
type FieldName = (typeof FIELD_NAMES)[number];

function fieldErrorId(formId: string, name: FieldName) {
  return `${formId}-${name}-error`;
}

export function ContactForm({
  variant = "embedded",
  className = "",
  showTitle = false,
  formProps,
}: ContactFormProps) {
  const { t } = useTranslation();
  const formId = useId();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const isPage = variant === "page";
  const inputRadius = isPage ? "rounded-xl" : "rounded-md";
  const labelLayout = isPage ? "grid gap-2" : "block";
  const inputSpacing = isPage ? "" : "mt-2";
  const fieldRow = isPage ? "grid gap-5 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2";
  const invalidFields = Object.keys(fieldErrors) as FieldName[];
  const hasFieldErrors = invalidFields.length > 0;
  const formAlertMessage =
    submitState === "error"
      ? t("contactSection.sendError")
      : hasFieldErrors
        ? t("contactSection.errors.formSummary")
        : null;

  const clearError = (name: FieldName) => {
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();

    if (form.checkValidity()) {
      const formData = new FormData(form);
      setSubmitState("submitting");
      setFieldErrors({});

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            subject: String(formData.get("subject") || t("contactSection.subject")),
            message: String(formData.get("message") ?? ""),
            website: String(formData.get("website") ?? ""),
          }),
        });

        if (!(await isSuccessfulContactResponse(response))) {
          throw new Error("contact_submission_failed");
        }
        form.reset();
        setSubmitState("success");
      } catch {
        setSubmitState("error");
      }
      return;
    }

    setSubmitState("idle");
    const invalidElements = Array.from(form.elements)
      .filter(
        (element): element is HTMLInputElement | HTMLTextAreaElement =>
          element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      )
      .filter((element) => !element.validity.valid);
    const nextErrors: Partial<Record<FieldName, string>> = {};

    for (const element of invalidElements) {
      const name = element.name as FieldName;
      if (FIELD_NAMES.includes(name)) {
        nextErrors[name] = getContactFieldError(element, t);
      }
    }

    setFieldErrors(nextErrors);
    window.setTimeout(() => shakeInvalidField(invalidElements[0]));
  };

  const fieldClass = (name: FieldName, extra = "") =>
    `${inputBase} ${inputSpacing} ${inputRadius} ${extra} ${
      fieldErrors[name] ? errorBorder : defaultBorder
    }`;

  const renderFieldError = (name: FieldName) => {
    const message = fieldErrors[name];
    if (!message) {
      return null;
    }

    return (
      <span
        id={fieldErrorId(formId, name)}
        className="text-sm font-medium text-destructive dark:text-[#ff8aa1]"
      >
        {message}
      </span>
    );
  };

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit}
      {...formProps}
      className={`t-input-wrap ${hasFieldErrors ? "is-error" : ""} ${className} ${formProps?.className ?? ""}`.trim()}
    >
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {showTitle ? (
        <h2 className="font-serif text-[32px] leading-none text-text-primary">
          {t("contactPage.formTitle")}
        </h2>
      ) : null}

      <div className={fieldRow}>
        <label
          htmlFor={`${formId}-name`}
          className={`t-input-wrap ${labelLayout} ${labelClass} ${fieldErrors.name ? "is-error" : ""}`}
        >
          {t("contactSection.name")}
          <input
            id={`${formId}-name`}
            name="name"
            autoComplete="name"
            required
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? fieldErrorId(formId, "name") : undefined}
            onInput={() => clearError("name")}
            className={fieldClass("name", isPage ? "h-12 px-4" : "h-12 w-full px-4 text-base font-normal")}
          />
          {renderFieldError("name")}
        </label>
        <label
          htmlFor={`${formId}-email`}
          className={`t-input-wrap ${labelLayout} ${labelClass} ${fieldErrors.email ? "is-error" : ""}`}
        >
          {t("contactSection.email")}
          <input
            id={`${formId}-email`}
            type="email"
            name="email"
            autoComplete="email"
            required
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? fieldErrorId(formId, "email") : undefined}
            onInput={() => clearError("email")}
            className={fieldClass("email", isPage ? "h-12 px-4" : "h-12 w-full px-4 text-base font-normal")}
          />
          {renderFieldError("email")}
        </label>
      </div>

      <label
        htmlFor={`${formId}-subject`}
        className={`t-input-wrap ${isPage ? "grid gap-2" : "mt-4 block"} ${labelClass}`}
      >
        {t("contactSection.subject")}
        <input
          id={`${formId}-subject`}
          name="subject"
          autoComplete="off"
          onInput={() => clearError("subject")}
          className={fieldClass("subject", isPage ? "h-12 px-4" : "h-12 w-full px-4 text-base font-normal")}
        />
      </label>

      <label
        htmlFor={`${formId}-message`}
        className={`t-input-wrap ${isPage ? "grid gap-2" : "mt-4 block"} ${labelClass} ${fieldErrors.message ? "is-error" : ""}`}
      >
        {t("contactSection.message")}
        <textarea
          id={`${formId}-message`}
          name="message"
          autoComplete="off"
          required
          rows={isPage ? undefined : 5}
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? fieldErrorId(formId, "message") : undefined}
          onInput={() => clearError("message")}
          className={fieldClass(
            "message",
            isPage
              ? "min-h-44 resize-y px-4 py-3"
              : "w-full resize-none px-4 py-3 text-base font-normal leading-7"
          )}
        />
        {renderFieldError("message")}
      </label>

      {submitState === "success" ? (
        <p role="status" aria-live="polite" className="text-sm font-medium text-text-accent">
          {t("contactSection.success")}
        </p>
      ) : null}
      {formAlertMessage ? (
        <p
          role="alert"
          aria-live="assertive"
          className={`text-sm font-medium text-destructive dark:text-[#ff8aa1] ${
            submitState === "error" ? "" : "sr-only"
          }`}
        >
          {formAlertMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitState === "submitting"}
        className={`inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full bg-action-strong px-6 text-[12px] font-semibold uppercase tracking-[1px] text-text-on-strong transition hover:bg-action-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page dark:bg-text-primary dark:text-[#1c1415] dark:hover:bg-text-accent dark:hover:text-text-on-strong ${
          isPage ? "w-fit gap-3 px-7" : "mt-5 w-full justify-center gap-2 sm:w-auto"
        }`}
      >
        <PaperAirplaneIcon className="size-4" aria-hidden="true" />
        {submitState === "submitting" ? t("contactSection.submitting") : t("contactSection.submit")}
      </button>
    </form>
  );
}
