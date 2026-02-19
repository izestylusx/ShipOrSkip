"use client";

import { useEffect, useMemo, useState } from "react";
import { Category, ProjectData, ProjectStatus } from "@/types";
import { getProjectCategories } from "@/lib/project-categories";
import FilterBar, { SortKey } from "@/components/projects/FilterBar";
import ProjectCard from "@/components/projects/ProjectCard";
import SkeletonCard from "@/components/projects/SkeletonCard";
import EmptyState from "@/components/projects/EmptyState";

interface Props {
  projects: ProjectData[];
}

export default function ProjectGrid({ projects }: Props) {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const categories = useMemo(() => {
    const allCategories = projects.flatMap((project) => getProjectCategories(project));
    return Array.from(new Set(allCategories)).sort() as Category[];
  }, [projects]);

  const counts = useMemo(
    () => ({
      all: projects.length,
      alive: projects.filter((project) => project.status === "alive").length,
      zombie: projects.filter((project) => project.status === "zombie").length,
      dead: projects.filter((project) => project.status === "dead").length,
    }),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const result = projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      if (categoryFilter !== "all") {
        const projectCategories = getProjectCategories(project);
        if (!projectCategories.includes(categoryFilter)) {
          return false;
        }
      }

      if (search) {
        const query = search.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.category.toLowerCase().includes(query) ||
          project.id.toLowerCase().includes(query)
        );
      }

      return true;
    });

    result.sort((left, right) => {
      switch (sortKey) {
        case "score":
          return right.survivalScore - left.survivalScore;
        case "name":
          return left.name.localeCompare(right.name);
        case "category":
          return left.category.localeCompare(right.category);
        case "status": {
          const order = { alive: 0, zombie: 1, dead: 2, pivoted: 3 };
          return order[left.status] - order[right.status];
        }
        case "marketCap":
          return (right.token?.marketCap ?? 0) - (left.token?.marketCap ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, statusFilter, categoryFilter, sortKey, search]);

  function clearFilters() {
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearch("");
    setSortKey("score");
  }

  return (
    <div className="space-y-4">
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        sortKey={sortKey}
        onSortChange={setSortKey}
        categories={categories}
        counts={counts}
      />

      <p className="text-warm-600 text-xs font-mono">
        {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
      </p>

      {!hydrated ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState onClear={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
