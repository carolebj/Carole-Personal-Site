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
          light: { "cal-brand": "#561e38" },
          dark: { "cal-brand": "#ffe1f1" },
        },
        hideEventTypeDetails: true,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[760px] rounded-2xl bg-white dark:bg-[#fbf7f5]">
      <Cal
        namespace="meet-carole"
        calLink="mrstev3n/meet-carole"
        config={{
          layout: "month_view",
          useSlotsViewOnSmallScreen: "true",
        }}
        style={{
          width: "100%",
          minHeight: "680px",
          overflow: "scroll",
        }}
        aria-label={t("contactPage.calendarTitle")}
      />
    </div>
  );
}
