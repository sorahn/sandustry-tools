const joinClassNames = (...classNames: Array<string | false | undefined>) =>
  classNames.filter(Boolean).join(" ");

const ELEMENT_ROW_BASE =
  "group flex items-center gap-2 px-2 py-1.5 text-left w-full rounded border transition-all duration-200";
const ELEMENT_ROW_SELECTED = "border-[#ffe700] bg-[#ffe700]/10";
const ELEMENT_ROW_IDLE = "border-slate-700 hover:border-slate-500 bg-black/40 hover:bg-black/60";

const ELEMENT_NAME_BASE = "text-xs truncate transition-colors";

export const elementRowClass = (selected: boolean) =>
  joinClassNames(ELEMENT_ROW_BASE, selected ? ELEMENT_ROW_SELECTED : ELEMENT_ROW_IDLE);

export const elementNameClass = (selected: boolean) =>
  joinClassNames(
    ELEMENT_NAME_BASE,
    selected ? "text-[#ffe700]" : "text-slate-300 group-hover:text-white",
  );

const MATTER_TAB_BASE =
  "text-xs px-3 py-1 border rounded-tr-lg rounded-bl-lg item-button-transition border-slate-200";

export const matterTabClass = (active: boolean) =>
  joinClassNames(
    MATTER_TAB_BASE,
    active
      ? "text-[#ffe700] border-opacity-50 bg-[#ffe700]/10"
      : "text-white border-opacity-25 hover:text-[#ffe700] hover:border-opacity-0 bg-black",
  );
