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
      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:px-10 lg:py-14">
        <div className="text-center lg:text-left">
          <p className="font-serif text-xl italic text-[#1c1b1b]">Carole T.</p>
          <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#5b4137]">
            © {year} {t("footer.signature")}
          </p>
        </div>

        <form className="w-full max-w-md" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="newsletter-email">
            {t("footer.newsletterLabel")}
          </label>
          <div className="flex rounded-full border border-[#e4bfb2]/45 bg-[#fcf9f8] p-1 shadow-sm focus-within:border-[#854d63]/70">
            <input
              id="newsletter-email"
              type="email"
              placeholder={t("footer.newsletterPlaceholder")}
              className="min-w-0 flex-1 rounded-full border-none bg-transparent px-5 py-2.5 text-sm text-[#1c1b1b] outline-none placeholder:text-[#5b4137]/55"
            />
            <button
              type="submit"
              className="rounded-full bg-[#854d63] px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#6a364b] sm:px-6"
            >
              {t("footer.newsletterCta")}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-6 lg:justify-end">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#5b4137] transition hover:text-[#854d63]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
