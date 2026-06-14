import brandFlagIcon from "../../assets/icons/brand-flag.svg?raw";
import announcementMegaphoneIcon from "../../assets/icons/announcement-megaphone.svg?raw";
import contentBriefEditIcon from "../../assets/icons/content-brief-edit.svg?raw";
import growthArrowIcon from "../../assets/icons/growth-arrow.svg?raw";

export const serviceIcons = [
  brandFlagIcon,
  announcementMegaphoneIcon,
  contentBriefEditIcon,
  growthArrowIcon,
] as const;

/** Accent tokens for service cards on Home. */
export const homeServiceAccents = [
  {
    icon: "bg-[#ffd9e4]",
    corner: "bg-[#ffd9e4]/55",
    /** Pastel circle stays light in dark mode — glyph must stay dark for contrast. */
    glyph: "text-[#854d63]",
    title: "text-text-accent dark:text-[#d8a4c7]",
  },
  {
    icon: "bg-[#ffdcbd]",
    corner: "bg-[#ffdcbd]/55",
    glyph: "text-[#8a5100]",
    title: "text-[#8a5100] dark:text-[#ffbf8c]",
  },
  {
    icon: "bg-[#ffdbcf]",
    corner: "bg-[#ffdbcf]/55",
    glyph: "text-[#a83900]",
    title: "text-[#a83900] dark:text-[#ff9a66]",
  },
  {
    icon: "bg-[#e5e2e1]",
    corner: "bg-[#e5e2e1]/70",
    glyph: "text-[#5b4137]",
    title: "text-text-secondary dark:text-[#ded7d2]",
  },
] as const;

/** Accent tokens for service listing cards on /services. */
export const servicesPageAccents = [
  {
    surface: "bg-[#fff3ee]",
    marker: "bg-[#ffd9e4]",
    text: "text-text-accent",
    border: "border-border-accent/42",
  },
  {
    surface: "bg-[#fff7ed]",
    marker: "bg-[#ffdcbd]",
    text: "text-[#8a5100]",
    border: "border-[#ead0bf]/60",
  },
  {
    surface: "bg-[#fff1ec]",
    marker: "bg-[#ffdbcf]",
    text: "text-[#a83900]",
    border: "border-[#eac4b4]/58",
  },
  {
    surface: "bg-[#f7f6f4]",
    marker: "bg-[#e5e2e1]",
    text: "text-text-secondary",
    border: "border-[#d9d0cc]/72",
  },
] as const;
