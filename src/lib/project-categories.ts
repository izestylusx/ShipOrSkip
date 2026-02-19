import type { Category } from "@/types";

type CategoryLikeProject = {
  category: Category;
  categories?: Category[] | null;
};

export function getProjectCategories(project: CategoryLikeProject): Category[] {
  const categories = project.categories;
  if (Array.isArray(categories) && categories.length > 0) {
    return categories;
  }
  return [project.category];
}

export function sharesAnyCategory(
  left: CategoryLikeProject,
  right: CategoryLikeProject
): boolean {
  const leftCategories = getProjectCategories(left);
  const rightCategories = getProjectCategories(right);
  return rightCategories.some((category) => leftCategories.includes(category));
}
