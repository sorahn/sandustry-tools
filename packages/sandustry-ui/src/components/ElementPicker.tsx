import { useDeferredValue, useMemo, type ReactNode } from "react";
import cx from "clsx";
import { ItemCard } from "./ItemCard";
import { SearchInput } from "./SearchInput";
import { SegmentedControl, type Segment } from "./SegmentedControl";
import "../elements/element-picker";

export type ElementPickerItem = {
  id: string;
  label: string;
  matter?: string;
  icon?: ReactNode;
};

export type ElementPickerProps = {
  items: readonly ElementPickerItem[];
  value?: string;
  query?: string;
  matter?: string;
  matterOptions?: readonly Segment[];
  onQueryChange?: (query: string) => void;
  onMatterChange?: (matter: string) => void;
  onSelect?: (item: ElementPickerItem) => void;
  className?: string;
};

export function ElementPicker({
  items,
  value,
  query = "",
  matter = "all",
  matterOptions,
  onQueryChange,
  onMatterChange,
  onSelect,
  className = "",
}: ElementPickerProps) {
  const deferredQuery = useDeferredValue(query);
  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery);
      const matchesMatter = matter === "all" || item.matter === matter;
      return matchesQuery && matchesMatter;
    });
  }, [deferredQuery, items, matter]);

  return (
    <sandustry-element-picker
      value={value}
      query={query}
      matter={matter}
      class={cx(
        "flex min-w-72 flex-col gap-2 rounded border border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface,#222222)]/95 p-2",
        className,
      )}
    >
      <SearchInput
        value={query}
        onChange={(event) => onQueryChange?.(event.target.value)}
        placeholder="Search"
      />
      {matterOptions ? (
        <SegmentedControl
          options={matterOptions}
          value={matter}
          size="small"
          onChange={(nextMatter) => onMatterChange?.(nextMatter)}
        />
      ) : null}
      <div className="grid max-h-80 grid-cols-4 gap-1.5 overflow-y-auto py-1.5">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            icon={item.icon}
            label={item.label}
            selected={item.id === value}
            onClick={() => onSelect?.(item)}
          />
        ))}
        {filteredItems.length === 0 ? (
          <p className="col-span-4 px-2 py-4 text-center text-xs text-[var(--sd-color-text-subtle,#808080)]">
            No elements found
          </p>
        ) : null}
      </div>
    </sandustry-element-picker>
  );
}
