import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const links = [
    { label: t("footer.instagram"), href: "https://www.instagram.com/" },
    { label: t("footer.linkedin"), href: "https://www.linkedin.com/" },
    { label: t("footer.contact"), href: "#contact" },
  ];

  return (
    <footer id="contact" className="relative overflow-hidden border-t border-[#e5e2e1]/70 bg-white">
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(255,217,228,0.28),rgba(255,217,228,0))]" />
      <div className="relative mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-7 px-5 py-10 sm:px-8 lg:flex-row lg:px-8 lg:py-12">
        <div className="text-center lg:text-left">
          <p className="font-serif text-xl italic text-[#1c1b1b]">Carole T.</p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[2px] text-[#5b4137]">
            © {year} {t("footer.signature")}
          </p>
        </div>

        <div className="flex flex-nowrap justify-center gap-6 whitespace-nowrap lg:justify-end">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[12px] font-semibold uppercase tracking-[2px] text-[#5b4137] transition hover:text-[#854d63]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
