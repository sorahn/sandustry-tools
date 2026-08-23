import type { PickerButtonProps } from "./pickerTypes";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;

export const FocusableButton = ({
  id,
  onActivate,
  neighbors,
  className = "",
  children,
  scope,
  ...props
}: PickerButtonProps & { scope: string }) => {
  if (!UIReact) return null;
  const focusable = api.ui.navigation.useFocusable({
    id,
    scope,
    onActivate,
    neighbors,
    scrollIntoView: true,
  });
  return (
    <button
      {...props}
      ref={focusable.ref}
      type="button"
      onClick={onActivate}
      className={`${className} ${api.ui.navigation.controllerFocusClass(focusable.focused)}`.trim()}
    >
      {children}
    </button>
  );
};
