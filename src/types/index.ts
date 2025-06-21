import { Project, Snippet, Task } from "@prisma/client";

type WithType<T, K extends ItemType> = T & { type: K };
type SnippetWithProject = Snippet & { project?: Project };
type TaskWithProject = Task & { project?: Project };

export type SaveStatus = "saving" | "saved" | "error" | "idle" | undefined;
export type ItemType = "project" | "task" | "snippet";

type ProjectWithType = WithType<Project, "project">;
type SnippetWithType = WithType<Snippet, "snippet">;
type TaskWithType = WithType<Task, "task">;

export type TypedItems = ProjectWithType | SnippetWithType | TaskWithType;
export type BaseItems = Project | Snippet | Task;
export type MeiliSearchPayload = Project | SnippetWithProject | TaskWithProject;

export type CacheDataSource =
  | WithType<Project, "project">
  | WithType<SnippetWithProject, "snippet">
  | WithType<TaskWithProject, "task">;

export type ProjectWithPin = Project & { isPinned: boolean };
