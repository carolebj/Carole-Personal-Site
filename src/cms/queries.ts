const imageProjection = `{
  ...,
  asset->
}`;

export const servicesQuery = `*[_type == "service"] | order(displayOrder asc, title.fr asc) {
  "slug": slug.current,
  title,
  accent,
  description,
  detailIntro,
  presentation,
  metricValue,
  metricLabel,
  bullets,
  whatIsIncluded,
  targetAudience,
  concreteApplications,
  caseStudy
}`;

export const blogPostsQuery = `*[_type == "blogPost"] | order(coalesce(publishedAt, _createdAt) desc) {
  "slug": slug.current,
  title,
  excerpt,
  "category": category->title,
  publishedAt,
  readingTime,
  featured,
  coverImage ${imageProjection},
  takeaways,
  body
}`;

export const testimonialsQuery = `*[_type == "testimonial"] | order(displayOrder asc, _createdAt asc) {
  quote,
  name,
  role,
  portrait ${imageProjection}
}`;

export const resourcesQuery = `*[_type == "resource"] | order(displayOrder asc, title.fr asc) {
  title,
  kind,
  description,
  url,
  image ${imageProjection}
}`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  title,
  description,
  contactEmail,
  socialLinks
}`;

export const cvEntryQuery = `*[_type == "cvEntry"] | order(displayOrder asc, _createdAt asc) {
  title,
  category,
  organization,
  period,
  description,
  highlights
}`;

export const homePageQuery = `*[_type == "homePage"][0] {
  hero {
    ...,
    portrait ${imageProjection}
  },
  manifesto,
  about {
    ...,
    image ${imageProjection}
  }
}`;
