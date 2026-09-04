import type { PickerElement } from "./pickerTypes";

export type ElementDefinition = {
  id?: string;
  hidden?: boolean;
  metaColor?: number;
  matterType?: number;
};

export type ElementCatalogSource = {
  getRegisteredTypes: () => number[];
  getDefinition: (type: number) => ElementDefinition | null;
  getName: (definition: ElementDefinition, fallback: string) => string;
  getId?: (type: number) => string | null;
  isTypeAllowed: (type: number) => boolean;
  isElementAllowed: (id: string | null, definition: ElementDefinition) => boolean;
};

const colorFromMetadata = (metaColor?: number) =>
  typeof metaColor === "number" ? `#${metaColor.toString(16).padStart(6, "0")}` : "#9aa7b5";

export const createElementCatalog = (source: ElementCatalogSource): PickerElement[] =>
  source
    .getRegisteredTypes()
    .map<PickerElement | null>((type) => {
      if (!source.isTypeAllowed(type)) return null;
      const definition = source.getDefinition(type);
      const id = definition?.id || source.getId?.(type) || null;
      if (!definition || !source.isElementAllowed(id, definition)) return null;
      return {
        id,
        type,
        name: source.getName(definition, id || `[type ${type}]`) || id || `[type ${type}]`,
        color: colorFromMetadata(definition.metaColor),
        matterType: definition.matterType,
      };
    })
    .filter((entry): entry is PickerElement => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

export const matterName = (matterType: number | undefined) =>
  (
    ({
      1: "Solid",
      2: "Liquid",
      3: "Particle",
      4: "Gas",
      5: "Static",
      6: "Slushy",
      7: "Wisp",
      8: "Powder",
    }) as Record<number, string>
  )[matterType ?? 0] || "Other";
