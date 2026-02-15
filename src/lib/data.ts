import { ProjectData } from "@/types";
import path from "path";
import fs from "fs";

/**
 * Load projects from data/projects.json (pipeline output)
 * Falls back to data-example/ if pipeline hasn't run
 */
export function getProjects(): ProjectData[] {
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

export function getProjectBySlug(slug: string): ProjectData | undefined {
  const projects = getProjects();
  return projects.find((p) => p.slug === slug);
}
