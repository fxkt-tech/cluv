import { MediaType } from "../types/timeline";

export // 根据类型选择颜色
const getClipColor = (type: MediaType) => {
  switch (type) {
    case "video":
      return "bg-accent-magenta border-accent-magenta/80";
    case "audio":
      return "bg-accent-green border-accent-green/80";
    case "image":
      return "bg-accent-blue border-accent-blue/80";
    case "text":
      return "bg-accent-yellow border-accent-yellow/80";
    default:
      return "bg-text-muted border-text-muted/80";
  }
};
