import { Project, Snippet, Task } from "@prisma/client";

type SnippetWithProject = Snippet & {
  project?: Project;
};

type TaskWithProject = Task & {
  project?: Project;
};

export type SaveStatus = "saving" | "saved" | "error" | "idle" | undefined;
export type ItemType = "project" | "task" | "snippet";
type WithType<T, K extends ItemType> = T & { type: K };

type ProjectWithType = WithType<Project, "project">;
type SnippetWithType = WithType<Snippet, "snippet">;
type TaskWithType = WithType<Task, "task">;

export type BaseItems = Project | Task | Snippet;

export type MeiliSearchPayload = Project | SnippetWithProject | TaskWithProject;

export type TypedItems = ProjectWithType | TaskWithType | SnippetWithType;

export type CacheDataSource =
  | ProjectWithType
  | (TaskWithType & { project?: Project })
  | (SnippetWithType & { project?: Project });
