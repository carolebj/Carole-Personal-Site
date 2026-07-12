import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useState, type FormHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { shakeInvalidField } from "./contactFormUtils";
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

export function ContactForm({
  variant = "embedded",
  className = "",
  showTitle = false,
  formProps,
}: ContactFormProps) {
  const { t } = useTranslation();
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const isPage = variant === "page";
  const inputRadius = isPage ? "rounded-xl" : "rounded-md";
  const labelLayout = isPage ? "grid gap-2" : "block";
  const inputSpacing = isPage ? "" : "mt-2";
  const fieldRow = isPage ? "grid gap-5 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2";

  const clearError = (name: string) => {
    setInvalidFields((current) => current.filter((field) => field !== name));
    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();

    if (form.checkValidity()) {
      const formData = new FormData(form);
      setSubmitState("submitting");
      setFormError("");

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
    const invalidNames = invalidElements.map((element) => element.name).filter(Boolean);
    const firstInvalid = invalidElements[0];

    setInvalidFields(invalidNames);
    setFormError(firstInvalid?.validationMessage ?? "");

    window.setTimeout(() => shakeInvalidField(firstInvalid));
  };

  const fieldClass = (name: string, extra = "") =>
    `${inputBase} ${inputSpacing} ${inputRadius} ${extra} ${
      invalidFields.includes(name) ? errorBorder : defaultBorder
    }`;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      {...formProps}
      className={`t-input-wrap ${formError ? "is-error" : ""} ${className} ${formProps?.className ?? ""}`.trim()}
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
        <label className={`t-input-wrap ${labelLayout} ${labelClass} ${invalidFields.includes("name") ? "is-error" : ""}`}>
          {t("contactSection.name")}
          <input
            name="name"
            autoComplete="name"
            required
            onInput={() => clearError("name")}
            className={fieldClass("name", isPage ? "h-12 px-4" : "h-12 w-full px-4 text-base font-normal")}
          />
        </label>
        <label className={`t-input-wrap ${labelLayout} ${labelClass} ${invalidFields.includes("email") ? "is-error" : ""}`}>
          {t("contactSection.email")}
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            onInput={() => clearError("email")}
            className={fieldClass("email", isPage ? "h-12 px-4" : "h-12 w-full px-4 text-base font-normal")}
          />
        </label>
      </div>

      <label
        className={`t-input-wrap ${isPage ? "grid gap-2" : "mt-4 block"} ${labelClass} ${invalidFields.includes("subject") ? "is-error" : ""}`}
      >
        {t("contactSection.subject")}
        <input
          name="subject"
          autoComplete="off"
          onInput={() => clearError("subject")}
          className={fieldClass("subject", isPage ? "h-12 px-4" : "h-12 w-full px-4 text-base font-normal")}
        />
      </label>

      <label
        className={`t-input-wrap ${isPage ? "grid gap-2" : "mt-4 block"} ${labelClass} ${invalidFields.includes("message") ? "is-error" : ""}`}
      >
        {t("contactSection.message")}
        <textarea
          name="message"
          autoComplete="off"
          required
          rows={isPage ? undefined : 5}
          onInput={() => clearError("message")}
          className={fieldClass(
            "message",
            isPage
              ? "min-h-44 resize-y px-4 py-3"
              : "w-full resize-none px-4 py-3 text-base font-normal leading-7"
          )}
        />
      </label>

      <p className={`t-error-msg text-sm font-medium text-destructive dark:text-[#ff8aa1] ${isPage ? "" : "mt-3"}`}>
        {formError}
      </p>

      {submitState === "success" ? (
        <p role="status" aria-live="polite" className="text-sm font-medium text-text-accent">
          {t("contactSection.success")}
        </p>
      ) : null}
      {submitState === "error" ? (
        <p role="alert" className="text-sm font-medium text-destructive dark:text-[#ff8aa1]">
          {t("contactSection.sendError")}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitState === "submitting"}
        className={`inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full bg-action-strong px-6 text-[12px] font-semibold uppercase tracking-[1px] text-text-on-strong transition hover:bg-action-accent dark:bg-text-primary dark:text-[#1c1415] dark:hover:bg-text-accent dark:hover:text-text-on-strong ${
          isPage ? "w-fit gap-3 px-7" : "mt-5 w-full justify-center gap-2 sm:w-auto"
        }`}
      >
        <PaperAirplaneIcon className="size-4" aria-hidden="true" />
        {submitState === "submitting" ? t("contactSection.submitting") : t("contactSection.submit")}
      </button>
    </form>
  );
}
