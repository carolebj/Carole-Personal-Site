const en = {
  nav: {
    about: "About",
    skills: "Skills",
    experience: "Experience",
    projects: "Projects",
    contact: "Contact",
  },

  hero: {
    subtitle: "Digital Communication & Community Manager",
    greeting: "Hi, I'm",
    description:
      "I craft compelling <strong>stories</strong> that build engaged <strong>communities</strong> and drive digital growth.",
    viewWork: "View Work",
    contactMe: "Contact Me",
    yearsCount: "5+ Years",
    yearsLabel: "of Digital Expertise",
  },

  about: {
    title: "About Me",
    intro:
      "I am a passionate Digital Communication & Community Manager with a proven track record of growing engaged online communities.",
    p1: "With over 5 years of experience in the digital landscape, I specialize in crafting strategies that not only reach audiences but resonate with them. My approach combines data-driven insights with creative storytelling to build authentic connections between brands and their customers.",
    p2: "My expertise spans across social media strategy, content creation, community engagement, and digital event coordination. I thrive in dynamic environments where I can leverage my skills to amplify brand voices and drive meaningful results.",
  },

  skills: {
    title: "My Expertise",
    items: [
      {
        name: "Social Media Strategy",
        description:
          "Developing comprehensive plans to increase brand awareness and engagement across platforms.",
      },
      {
        name: "Community Management",
        description:
          "Building and nurturing online communities to foster loyalty and advocacy.",
      },
      {
        name: "Graphic Design",
        description:
          "Creating visually appealing content using tools like Canva, Photoshop, and Illustrator.",
      },
      {
        name: "SEO Writing",
        description:
          "Crafting optimized content that ranks well on search engines and drives organic traffic.",
      },
      {
        name: "Event Communication",
        description:
          "Promoting and managing digital communication for webinars, launches, and live events.",
      },
      {
        name: "Reporting & Analytics",
        description:
          "Analyzing performance metrics to refine strategies and demonstrate ROI.",
      },
    ],
  },

  metrics: {
    audienceGrowth: "Audience Growth",
    organicTraffic: "Organic Traffic",
    campaigns: "Campaigns",
    events: "Events",
  },

  experience: {
    title: "Professional Journey",
    items: [
      {
        role: "Digital Communication Manager",
        company: "TechInnovate Africa",
        period: "2021 - Present",
        location: "Cotonou, Benin",
        description:
          "Leading the digital strategy for a pan-African tech hub. Increased social media engagement by 200% and successfully launched 3 major virtual summits.",
      },
      {
        role: "Community Manager",
        company: "GreenLeaf Agency",
        period: "2019 - 2021",
        location: "Remote",
        description:
          "Managed online communities for 5+ sustainable lifestyle brands. Grew Instagram following from 5k to 25k organic followers in 18 months.",
      },
      {
        role: "Junior Content Creator",
        company: "Creative Digital",
        period: "2018 - 2019",
        location: "Cotonou, Benin",
        description:
          "Assisted in creating visual assets and copywriting for blog posts. Learned the fundamentals of SEO and digital storytelling.",
      },
    ],
  },

  projects: {
    title: "Selected Works",
    subtitle:
      "A showcase of my recent collaborations and successful campaigns.",
    viewAll: "View All Projects",
    items: [
      {
        title: "Digital Strategy & Rebranding",
        category: "Brand Identity",
        description:
          "Complete digital overhaul for a leading fashion retailer, resulting in a 40% increase in online sales.",
      },
      {
        title: "Eco-Summit 2023",
        category: "Event Communication",
        description:
          "Managed live social media coverage and community engagement for a 3-day international sustainability conference.",
      },
      {
        title: "Community Growth Campaign",
        category: "Social Media",
        description:
          "Executed a viral hashtag campaign that grew the brand's community by 15,000 active members in 3 months.",
      },
    ],
  },

  certifications: {
    title: "Continuous Learning",
    items: [
      "Google Digital Garage - Fundamentals of Digital Marketing",
      "HubSpot Social Media Marketing Certification",
      "Meta Certified Community Manager",
      "LinkedIn Marketing Strategy",
    ],
  },

  contact: {
    title: "Let's Work Together",
    subtitle:
      "Have a project in mind or want to discuss how we can grow your community? I'm always open to new opportunities and collaborations.",
    email: "Email",
    phone: "Phone",
    location: "Location",
    locationValue: "Cotonou, Benin & Remote",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "your@email.com",
    subjectLabel: "Subject",
    subjectPlaceholder: "Project inquiry",
    messageLabel: "Message",
    messagePlaceholder: "Tell me about your project...",
    send: "Send Message",
  },

  footer: {
    role: "Digital Communication & Community Manager",
    rights: "All rights reserved.",
  },

  errorPages: {
    notFound: {
      title: "Page not found",
      description:
        "The page you're looking for doesn't exist or has been moved. Please check the URL or go back to the homepage.",
      backHome: "Back to homepage",
      explore: "Explore projects",
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