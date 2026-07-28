import { CATEGORIES, type Category } from "@/lib/types";
import { suggestFilename } from "./filename";
import type { DateRange, ExportFormatId, ExportOptions } from "./types";

export type ExportAction =
  | { type: "set-format"; format: ExportFormatId }
  | { type: "set-range"; range: DateRange }
  | { type: "set-range-field"; field: keyof DateRange; value: string }
  | { type: "toggle-category"; category: Category }
  | { type: "set-categories"; categories: Category[] }
  | { type: "set-filename"; filename: string }
  | { type: "reset"; today: string };

export function createInitialOptions(today: string): ExportOptions {
  return {
    format: "csv",
    range: { from: "", to: "" },
    categories: [...CATEGORIES],
    filename: suggestFilename(today),
  };
}

/** Keeps category order stable regardless of the order boxes were ticked. */
function sortCategories(categories: Category[]): Category[] {
  return CATEGORIES.filter((category) => categories.includes(category));
}

export function exportOptionsReducer(state: ExportOptions, action: ExportAction): ExportOptions {
  switch (action.type) {
    case "set-format":
      return { ...state, format: action.format };

    case "set-range":
      return { ...state, range: action.range };

    case "set-range-field":
      return { ...state, range: { ...state.range, [action.field]: action.value } };

    case "toggle-category": {
      const has = state.categories.includes(action.category);
      const next = has
        ? state.categories.filter((c) => c !== action.category)
        : [...state.categories, action.category];
      return { ...state, categories: sortCategories(next) };
    }

    case "set-categories":
      return { ...state, categories: sortCategories(action.categories) };

    case "set-filename":
      return { ...state, filename: action.filename };

    case "reset":
      return createInitialOptions(action.today);

    default:
      return state;
  }
}
