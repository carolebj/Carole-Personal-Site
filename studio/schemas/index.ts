import { blockContent } from "./objects/blockContent";
import { localizedBlockContent } from "./objects/localizedBlockContent";
import { localizedString } from "./objects/localizedString";
import { localizedText } from "./objects/localizedText";
import { blogPost } from "./documents/blogPost";
import { category } from "./documents/category";
import { cvEntry } from "./documents/cvEntry";
import { homePage } from "./documents/homePage";
import { resource } from "./documents/resource";
import { service } from "./documents/service";
import { siteSettings } from "./documents/siteSettings";
import { testimonial } from "./documents/testimonial";

export const schemaTypes = [
  localizedString,
  localizedText,
  blockContent,
  localizedBlockContent,
  siteSettings,
  homePage,
  category,
  service,
  blogPost,
  testimonial,
  resource,
  cvEntry,
];
