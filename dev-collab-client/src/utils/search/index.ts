import { TypedItems } from "../../types";

export const filterByQuery = <T>(
  items: T[],
  query: string,
  showAllOnEmpty: boolean = false,
  getSearchValue: (item: T) => string = (item: any) =>
    String(item.title || item.label || item.name || ""),
): T[] => {
  if (!query && showAllOnEmpty) return items;
  if (!query) return [];

  const lowerQuery = query.toLowerCase().trim();
  const escapedQuery = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedQuery}\\b`, "i");

  return items?.filter((item) => {
    const value = getSearchValue(item);
    return regex.test(value);
  });
};

export const getDisplayTitle = (item: TypedItems): string => {
  switch (item.type) {
    case "workspace":
      return item.title;
    case "snippet":
      return `${item.title}.${item.extension ?? ""}`;
    case "workItem":
      return item.title;
    case "doc":
      return item.label;
    case "chat":
      return item.title ?? "Unnamed Chat";
    default:
      return "Untitled";
  }
};
