/**
 * Empty Module
 * Displayed when no clip or resource is selected
 */

import { PropertyIcon } from "../../../icons/UIIcons";

export function EmptyModule() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-text-muted">
      <PropertyIcon size={48} className="mb-4 opacity-50" />
      <span className="text-sm">属性</span>
    </div>
  );
}
