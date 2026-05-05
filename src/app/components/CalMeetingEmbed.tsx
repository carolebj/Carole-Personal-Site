import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function CalMeetingEmbed() {
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "meet-carole" });
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#64173b" },
          dark: { "cal-brand": "#ffd7f1" },
        },
        hideEventTypeDetails: true,
        layout: "week_view",
      });
    })();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e2e1]/80 bg-white dark:border-white/10 dark:bg-[#fbf7f5]">
      <Cal
        namespace="meet-carole"
        calLink="mrstev3n/meet-carole"
        config={{
          layout: "week_view",
          useSlotsViewOnSmallScreen: "true",
        }}
        style={{
          width: "100%",
          height: "680px",
          overflow: "scroll",
        }}
        aria-label={t("contactPage.calendarTitle")}
      />
    </div>
  );
}
