import React, { createContext, useContext, useState } from "react";
import type { CanonicalChordEvent } from "../../../utils/music/analysis/models/CanonicalChordEvent";
import type { CanonicalProgressionEvent } from "../../../utils/music/analysis/models/CanonicalProgressionEvent";
import type { CanonicalScoreEvent } from "../../../utils/music/analysis/models/CanonicalScoreEvent";
import type { FunctionalAnalysis } from "../../../utils/music/analysis/models/FunctionalAnalysis";

export type ContractType = "chord" | "progression" | "score";

export type LoadedPayload = CanonicalChordEvent | CanonicalProgressionEvent | CanonicalScoreEvent | null;

export interface PlaygroundState {
  rawPayload: string;
  activeContractType: ContractType;
  loadedPayload: LoadedPayload;
  analysisResult: FunctionalAnalysis | null;
  bridgeLogs: string[];
}

export interface PlaygroundActions {
  setRawPayload: (text: string) => void;
  setActiveContractType: (type: ContractType) => void;
  setLoadedPayload: (payload: LoadedPayload) => void;
  setAnalysisResult: (result: FunctionalAnalysis | null) => void;
  addBridgeLog: (log: string) => void;
  clearBridgeLogs: () => void;
  loadPayload: () => { success: boolean; error?: string };
}

interface PlaygroundContextProps {
  state: PlaygroundState;
  actions: PlaygroundActions;
}

const PlaygroundContext = createContext<PlaygroundContextProps | undefined>(undefined);

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawPayload, setRawPayload] = useState<string>("");
  const [activeContractType, setActiveContractType] = useState<ContractType>("progression");
  const [loadedPayload, setLoadedPayload] = useState<LoadedPayload>(null);
  const [analysisResult, setAnalysisResult] = useState<FunctionalAnalysis | null>(null);
  const [bridgeLogs, setBridgeLogs] = useState<string[]>([]);

  const addBridgeLog = (log: string) => {
    setBridgeLogs(prev => [log, ...prev]);
  };

  const clearBridgeLogs = () => {
    setBridgeLogs([]);
  };

  const loadPayload = (): { success: boolean; error?: string } => {
    try {
      if (!rawPayload.trim()) {
        return { success: false, error: "O JSON está vazio." };
      }
      const parsed = JSON.parse(rawPayload);
      setLoadedPayload(parsed);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Erro desconhecido ao parsear o JSON." };
    }
  };

  const state: PlaygroundState = {
    rawPayload,
    activeContractType,
    loadedPayload,
    analysisResult,
    bridgeLogs
  };

  const actions: PlaygroundActions = {
    setRawPayload,
    setActiveContractType,
    setLoadedPayload,
    setAnalysisResult,
    addBridgeLog,
    clearBridgeLogs,
    loadPayload
  };

  return (
    <PlaygroundContext.Provider value={{ state, actions }}>
      {children}
    </PlaygroundContext.Provider>
  );
};

export const usePlayground = () => {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error("usePlayground deve ser usado dentro de um PlaygroundProvider");
  }
  return context;
};
