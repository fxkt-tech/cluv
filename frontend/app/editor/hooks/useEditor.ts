import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CutProtocol } from "../types/protocol";

export function useEditor(projectId: string | null) {
  const [protocol, setProtocol] = useState<CutProtocol | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProtocol = async () => {
    if (!projectId) {
      setProtocol(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const jsonString = await invoke<string>("get_protocol", {
        projectId: projectId,
      });
      const protocolData: CutProtocol = JSON.parse(jsonString);
      setProtocol(protocolData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load protocol");
      setProtocol(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProtocol();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const saveProtocol = async (protocol: CutProtocol) => {
    if (!projectId) {
      throw new Error("No project ID provided");
    }

    try {
      const jsonString = JSON.stringify(protocol);
      await invoke("save_protocol", {
        projectId: projectId,
        protoContent: jsonString,
      });
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to save protocol",
      );
    }
  };

  return {
    protocol,
    isLoading,
    error,
    saveProtocol,
    reloadProtocol: loadProtocol,
  };
}
