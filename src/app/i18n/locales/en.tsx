const en = {
  nav: {
    services: "Services",
    manifesto: "Manifesto",
    about: "About",
    testimonials: "Reviews",
    contact: "Contact",
    language: "Choose language",
    menu: "Open menu",
  },

  hero: {
    eyebrow: "Social Media Agency Paris",
    titleStart: "Build a social presence",
    titleAccent: "clear & engaging",
    titleEnd: "for your brand.",
    description:
      "I help you define and execute a tailored editorial strategy that grows your community with clarity and authenticity.",
    primaryCta: "Let's talk",
    secondaryCta: "My services",
    badgeTop: "Creative",
    badgeBottom: "Direction",
    imageAlt: "Portrait of Carole Tonoukouen",
  },

  manifesto: {
    titleTop: "Posting without strategy",
    titleAccent: "is no longer enough.",
    p1: "In a saturated digital environment, attention is the rarest resource. A successful social presence is not built on volume, but on relevance, clarity, and authenticity.",
    p2: "It is time to move from reactive communication to intentional editorial direction.",
  },

  about: {
    titleTop: "Lovely to meet you,",
    titleAccent: "I'm Carole",
    p1: "I help small businesses and organizations share their message and maximize their impact while staying profitable and authentic.",
    p2: "I lead strategic thinking, editorial design, and content creation. Together, we shape the creative vision, the topics you care about, and the ideas you master to build an engaged community.",
    imageAlt: "Carole working on editorial direction",
    traits: [
      { label: "Writer" },
      { label: "Strategist" },
      { label: "Coffee lover" },
    ],
  },

  services: {
    titleAccent: "My",
    titleRest: "Services",
    subtitle:
      "Tailored solutions to structure and amplify your digital voice.",
    items: [
      {
        title: "Editorial",
        accent: "Strategy",
        description:
          "Definition of your editorial line, content pillars, and distinctive positioning across social platforms.",
      },
      {
        title: "Social Media",
        accent: "Direction",
        description:
          "Stewardship of your online presence, engaging editorial calendars, and digital campaign management to maximize day-to-day impact.",
      },
      {
        title: "Content",
        accent: "Creation",
        description:
          "High-value post writing, compelling visual concepts, and formats adapted to the standards of each platform.",
      },
      {
        title: "Audit &",
        accent: "Consulting",
        description:
          "In-depth review of your current presence with strategic recommendations to improve performance.",
      },
    ],
  },

  testimonials: {
    eyebrow: "Testimonials",
    titleStart: "Kind words from",
    titleAccent: "my clients",
    items: [
      {
        quote:
          "I finally attract the right people into my inbox. In just a few weeks, I converted a prospect into a long-term client thanks to a LinkedIn post. Thank you, Carole, for structuring my presence.",
        name: "Uzoma Obidike",
        role: "Founder, She Leads",
      },
      {
        quote:
          "Carole understands my brand, what it stands for, and creates content that is genuinely aligned with my vision. She does beautiful work capturing my unique voice.",
        name: "Cynthia S.",
        role: "Podcast host",
      },
      {
        quote:
          "She taught us how to use each platform effectively and stay on top of what is relevant today. I definitely recommend the investment.",
        name: "Julian F.",
        role: "Consulting director",
      },
    ],
  },

  footer: {
    signature: "Social Media Direction.",
    newsletterLabel: "Email address to join the newsletter",
    newsletterPlaceholder: "Join the newsletter",
    newsletterCta: "Sign up",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    contact: "Contact",
  },

  errorPages: {
    notFound: {
      title: "Page not found",
      description:
        "The page you're looking for doesn't exist or has been moved. Please check the URL or go back to the homepage.",
      backHome: "Back to homepage",
      explore: "Explore services",
    },
    routeError: {
      title: "Something went wrong",
      description:
        "An error occurred while loading this page. You can try again or go back to the homepage.",
      retry: "Try again",
    },
    critical: {
      title: "Something went wrong",
      description:
        "An unexpected error occurred. Please try again or go back to the homepage.",
    },
  },
} as const;

export default en;
