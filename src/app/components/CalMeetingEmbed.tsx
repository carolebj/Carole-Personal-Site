import Cal, { getCalApi, type EmbedEvent } from "@calcom/embed-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/ThemeContext";

const CAL_NAMESPACE = "rendez-vous-carole";
const CAL_LINK = "meetcarole/rendez-vous";
const CAL_LAYOUT = "month_view";
const CAL_BOOKING_SUCCESSFUL_EVENT = `CAL:${CAL_NAMESPACE}:bookingSuccessfulV2`;

export default function CalMeetingEmbed() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [embedKey, setEmbedKey] = useState(0);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const resetTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
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
        layout: CAL_LAYOUT,
      });
    })();
  }, [resolvedTheme]);

  useEffect(() => {
    let isMounted = true;
    let calApi: Awaited<ReturnType<typeof getCalApi>> | null = null;

    const clearTimers = () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = null;
      }
    };

    const submitBooking = () => {
      if (!isMounted) {
        return;
      }

      clearTimers();
      setBookingSubmitted(true);
      resetTimerRef.current = window.setTimeout(() => {
        setEmbedKey((currentKey) => currentKey + 1);
      }, 400);
      noticeTimerRef.current = window.setTimeout(() => {
        setBookingSubmitted(false);
      }, 9000);
    };

    const handleBookingSubmitted = (_event: EmbedEvent<"bookingSuccessfulV2">) => {
      submitBooking();
    };
    const handleWindowBookingSubmitted = () => {
      submitBooking();
    };
    const handleCalMessage = (event: MessageEvent) => {
      const data = event.data as { fullType?: string; namespace?: string; type?: string } | null;
      if (
        data?.fullType === CAL_BOOKING_SUCCESSFUL_EVENT ||
        (data?.namespace === CAL_NAMESPACE && data?.type === "bookingSuccessfulV2")
      ) {
        submitBooking();
      }
    };

    window.addEventListener(CAL_BOOKING_SUCCESSFUL_EVENT, handleWindowBookingSubmitted);
    window.addEventListener("message", handleCalMessage);

    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      if (!isMounted) {
        return;
      }
      calApi = cal;
      cal("on", {
        action: "bookingSuccessfulV2",
        callback: handleBookingSubmitted,
      });
    })();

    return () => {
      isMounted = false;
      clearTimers();
      window.removeEventListener(CAL_BOOKING_SUCCESSFUL_EVENT, handleWindowBookingSubmitted);
      window.removeEventListener("message", handleCalMessage);
      calApi?.("off", {
        action: "bookingSuccessfulV2",
        callback: handleBookingSubmitted,
      });
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      {bookingSubmitted ? (
        <div
          role="status"
          className="mb-4 rounded-[14px] border border-[#854d63]/25 bg-[#fff4f7] px-5 py-4 text-sm leading-6 text-text-secondary dark:border-[#f0adc4]/25 dark:bg-[#2a1a22] dark:text-text-secondary"
        >
          <strong className="block text-[15px] text-text-primary dark:text-text-primary">
            {t("contactPage.bookingSubmittedTitle")}
          </strong>
          {t("contactPage.bookingSubmittedDescription")}
        </div>
      ) : null}
      <Cal
        key={embedKey}
        namespace={CAL_NAMESPACE}
        calLink={CAL_LINK}
        config={{
          layout: CAL_LAYOUT,
          useSlotsViewOnSmallScreen: "true",
          theme: resolvedTheme,
        }}
        style={{
          width: "100%",
          minHeight: "760px",
          height: "100%",
          overflow: "auto",
        }}
        aria-label={t("contactPage.calendarTitle")}
      />
    </div>
  );
}
