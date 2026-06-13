export type OptionalFields = "id" | "createdAt" | "updatedAt";

export type MakeCreateData<T> = Omit<T, OptionalFields> &
  Partial<Pick<T, Extract<keyof T, OptionalFields>>>;

export type SaveStatus = "saving" | "saved" | "error" | "idle" | undefined;
