import { FeedbackCategory } from "./api";

export const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "course", label: "Course & Curriculum" },
  { value: "teacher", label: "Teaching Quality" },
  { value: "facilities", label: "Institute Facilities" },
  { value: "app", label: "App & Portal" },
  { value: "fees", label: "Fees & Payments" },
  { value: "other", label: "Other" },
];

export function getCategoryLabel(category: FeedbackCategory) {
  return FEEDBACK_CATEGORIES.find((c) => c.value === category)?.label || category;
}