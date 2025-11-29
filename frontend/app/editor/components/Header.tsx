/**
 * Header Component
 * Top navigation bar with menu and export button
 */

import { COLORS, SIZES } from "../constants/theme";
import { MENU_ITEMS } from "../constants/data";

interface HeaderProps {
  projectName: string;
  onExport?: () => void;
  onBack?: () => void;
}

export function Header({ projectName, onExport, onBack }: HeaderProps) {
  return (
    <header
      className={`${SIZES.header} flex items-center justify-between px-4 bg-[${COLORS.editor.bg}] border-b border-[${COLORS.editor.border}] shrink-0`}
      style={{
        backgroundColor: COLORS.editor.bg,
        borderBottomColor: COLORS.editor.border,
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="hover:text-white px-2 py-1 transition-colors"
          aria-label="Go back"
        >
          ←
        </button>
        <div className="font-bold text-lg text-white">KivaCut</div>
        <nav className="flex gap-2 text-sm">
          {MENU_ITEMS.map((item) => (
            <button
              key={item}
              className="hover:text-white px-2 py-1 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
      <div className="text-sm text-neutral-500">{projectName}</div>
      <div>
        <button
          onClick={onExport}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-4 py-1.5 rounded text-sm transition-colors"
          aria-label="Export project"
        >
          Export
        </button>
      </div>
    </header>
  );
}
