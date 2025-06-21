import { Project, Snippet, Task } from "@prisma/client";

export type ProjectWithPin = Project & { isPinned: boolean };

type WithType<T, K extends ItemType> = T & { type: K };
type SnippetWithProject = Snippet & { project?: ProjectWithPin };
type TaskWithProject = Task & { project?: ProjectWithPin };

export type SaveStatus = "saving" | "saved" | "error" | "idle" | undefined;
export type ItemType = "project" | "task" | "snippet";

type ProjectWithType = WithType<ProjectWithPin, "project">;
type SnippetWithType = WithType<Snippet, "snippet">;
type TaskWithType = WithType<Task, "task">;

export type TypedItems = ProjectWithType | SnippetWithType | TaskWithType;
export type BaseItems = ProjectWithPin | Snippet | Task;
export type MeiliSearchPayload =
  | ProjectWithPin
  | SnippetWithProject
  | TaskWithProject;

export type CacheDataSource =
  | WithType<ProjectWithPin, "project">
  | WithType<SnippetWithProject, "snippet">
  | WithType<TaskWithProject, "task">;
