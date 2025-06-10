import { Project, Snippet, Task } from "@prisma/client";

type ItemType = "project" | "task" | "snippet";
type WithType<T, K extends ItemType> = T & { type: K };

type ProjectWithType = WithType<Project, "project">;
type SnippetWithType = WithType<Snippet, "snippet">;
type TaskWithType = WithType<Task, "task">;

export type BaseItems = Project | Task | Snippet;
export type TypedItems = ProjectWithType | TaskWithType | SnippetWithType;
