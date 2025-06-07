import { Project, Snippet, Task } from "@prisma/client";

export type WithType<T, K extends string> = T & { type: K };

type ProjectWithType = WithType<Project, "project">;
type SnippetWithType = WithType<Snippet, "snippet">;
type TaskWithType = WithType<Task, "task">;

export type BaseItems = Project | Task | Snippet;

export type TypedItems = ProjectWithType | TaskWithType | SnippetWithType;

export type MeiliSearchResponse = SnippetWithType | TaskWithType;
