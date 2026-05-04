const en = {
  nav: {
    services: "Services",
    manifesto: "Manifesto",
    about: "About",
    testimonials: "Reviews",
    blog: "Blog",
    contact: "Contact",
    language: "Choose language",
    menu: "Open menu",
    openHeader: "Show full menu",
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
        slug: "editorial-strategy",
        title: "Editorial",
        accent: "Strategy",
        description:
          "Definition of your editorial line, content pillars, and distinctive positioning across social platforms.",
        detailIntro:
          "A clear foundation that turns scattered ideas into a durable editorial line people can understand and follow.",
        metricValue: "3 to 5",
        metricLabel: "content pillars structured to guide recurring publishing",
        projectTitle: "Clarifying a founder's authority",
        projectDescription:
          "Organizing LinkedIn angles, prioritizing expert topics, and preparing a monthly editorial calendar.",
        bullets: ["Positioning audit", "Content pillars", "Editorial calendar"],
      },
      {
        slug: "social-media-direction",
        title: "Social Media",
        accent: "Direction",
        description:
          "Stewardship of your online presence, engaging editorial calendars, and digital campaign management to maximize day-to-day impact.",
        detailIntro:
          "Ongoing guidance to keep a creative direction, publish intentionally, and connect content to business goals.",
        metricValue: "+4",
        metricLabel: "weeks of editorial visibility planned ahead",
        projectTitle: "Creating a reliable publishing rhythm",
        projectDescription:
          "Setting the cadence, coordinating content, and tracking themes that create stronger conversations.",
        bullets: ["Editorial planning", "Creative coordination", "Performance review"],
      },
      {
        slug: "content-creation",
        title: "Content",
        accent: "Creation",
        description:
          "High-value post writing, compelling visual concepts, and formats adapted to the standards of each platform.",
        detailIntro:
          "Content designed to carry the brand voice, support consistency, and build a more natural relationship with the audience.",
        metricValue: "12+",
        metricLabel: "editorial formats that can be adapted month after month",
        projectTitle: "Turning expertise into content",
        projectDescription:
          "Turning long-form ideas into posts, carousel angles, and short scripts to maintain a clear presence without starting over.",
        bullets: ["Post writing", "Carousel angles", "Short scripts"],
      },
      {
        slug: "audit-consulting",
        title: "Audit &",
        accent: "Consulting",
        description:
          "In-depth review of your current presence with strategic recommendations to improve performance.",
        detailIntro:
          "A direct read of your current presence to identify what slows understanding, engagement, or conversion.",
        metricValue: "48h",
        metricLabel: "to receive a first actionable synthesis",
        projectTitle: "Finding gaps between image and message",
        projectDescription:
          "Reviewing existing content, bios, recurring messages, and the most useful editorial opportunities.",
        bullets: ["Profile diagnostic", "Content review", "Prioritized action plan"],
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
    instagram: "Instagram",
    linkedin: "LinkedIn",
    contact: "Contact",
  },

  blog: {
    title: "Blog",
    subtitle:
      "This page is under construction. It will soon host notes on editorial strategy, social media, and content creation.",
  },

  serviceDetail: {
    eyebrow: "Service",
    metric: "Useful metric",
    project: "Related project",
    includes: "What this can include",
    back: "Back to services",
    cta: "Let's discuss this need",
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
