import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/ThemeContext";

export default function CalMeetingEmbed() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "meet-carole" });
      cal("ui", {
        theme: resolvedTheme,
        cssVarsPerTheme: {
          light: {
            "cal-brand": "#561e38",
            "cal-bg": "#ffffff",
            "cal-text": "#1c1b1b",
            "cal-border": "#e5e2e1",
          },
          dark: {
            "cal-brand": "#ffe1f1",
            "cal-bg": "#171312",
            "cal-text": "#f8f1ec",
            "cal-border": "rgba(255, 255, 255, 0.12)",
          },
        },
        hideEventTypeDetails: true,
        layout: "month_view",
      });
    })();
  }, [resolvedTheme]);

  return (
    <div className="cal-meeting-embed mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-[#e5e2e1]/85 bg-white dark:border-white/10 dark:bg-[#171312]">
      <Cal
        namespace="meet-carole"
        calLink="mrstev3n/meet-carole"
        config={{
          layout: "month_view",
          useSlotsViewOnSmallScreen: "true",
          theme: resolvedTheme,
        }}
        style={{
          width: "100%",
          minHeight: "680px",
          height: "100%",
          overflow: "auto",
        }}
        aria-label={t("contactPage.calendarTitle")}
      />
    </div>
  );
}
