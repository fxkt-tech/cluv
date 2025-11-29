import { ProjectHistory } from "../hooks/useProjectList";

interface ProjectCardProps {
  project: ProjectHistory;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProjectCard({
  project,
  isSelected,
  onSelect,
}: ProjectCardProps) {
  const createdDate = new Date(project.create_time).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const lastModifiedDate = new Date(project.last_modified).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-lg border transition-all ${
        isSelected
          ? "bg-cyan-900/30 border-cyan-500 shadow-lg shadow-cyan-500/20"
          : "bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-semibold text-white truncate flex-1">
          {project.name}
        </h3>
        {isSelected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
      </div>

      <p className="text-slate-400 text-xs mb-2 truncate">{project.path}</p>

      <div className="flex flex-col gap-1 pt-2 border-t border-slate-700">
        <span className="text-slate-500 text-xs">Created: {createdDate}</span>
        <span className="text-slate-500 text-xs">
          Modified: {lastModifiedDate}
        </span>
      </div>
    </button>
  );
}
