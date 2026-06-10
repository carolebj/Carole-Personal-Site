import {
  HomeIcon,
  Squares2X2Icon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  SparklesIcon,
  UserGroupIcon,
  AcademicCapIcon,
  TagIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { IconKey } from "./schema";

const icons: Record<IconKey, typeof HomeIcon> = {
  home: HomeIcon,
  services: Squares2X2Icon,
  blog: NewspaperIcon,
  testimonial: ChatBubbleLeftRightIcon,
  resource: SparklesIcon,
  community: UserGroupIcon,
  book: BookOpenIcon,
  reference: DocumentTextIcon,
  cv: AcademicCapIcon,
  category: TagIcon,
  settings: Cog6ToothIcon,
};

export function TypeIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const Icon = icons[icon] ?? HomeIcon;
  return <Icon className={className} />;
}
