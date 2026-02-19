import { ProjectData } from "@/types";
import path from "path";
import fs from "fs";
import { fetchProjects, fetchProjectBySlug } from "@/lib/pipeline-api";
import { mapPipelineProjects, mapPipelineProject } from "@/lib/pipeline-mapper";

/**
 * Load projects — tries live Pipeline v2 API first, falls back to JSON file.
 * In Next.js server components this runs at request time (ISR with 10min cache).
 */
export async function getProjects(): Promise<ProjectData[]> {
  // 1. Try live API
  const apiProjects = await fetchProjects(2000);
  if (apiProjects.length > 0) {
    return mapPipelineProjects(apiProjects);
  }

  // 2. Fallback: local JSON file
  return getProjectsFromFile();
}

/**
 * Load a single project by slug — API first, then file fallback.
 */
export async function getProjectBySlug(slug: string): Promise<ProjectData | undefined> {
  const apiProject = await fetchProjectBySlug(slug);
  if (apiProject) {
    return mapPipelineProject(apiProject);
  }

  // Fallback
  const all = getProjectsFromFile();
  return all.find((p) => p.slug === slug);
}

/**
 * Synchronous fallback: read from data/projects.json (old pipeline output).
 */
export function getProjectsFromFile(): ProjectData[] {
  const dataPath = path.join(process.cwd(), "data", "projects.json");
  const examplePath = path.join(
    process.cwd(),
    "data-example",
    "projects.example.json"
  );

  let filePath = dataPath;
  if (!fs.existsSync(dataPath)) {
    if (fs.existsSync(examplePath)) {
      filePath = examplePath;
    } else {
      return [];
    }
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ProjectData[];
}
