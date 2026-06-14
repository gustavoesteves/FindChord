import { PlaygroundProvider } from "./playground/context/PlaygroundContext";
import { PayloadStudio } from "./playground/PayloadStudio";
import { ContractValidator } from "./playground/ContractValidator";
import { EngineSimulator } from "./playground/EngineSimulator";
import { APIInspector } from "./playground/APIInspector";
import { ContractCoverageDashboard } from "./playground/ContractCoverageDashboard";
import { MuseScoreBridgeMock } from "./playground/MuseScoreBridgeMock";

export default function Playground() {
  return (
    <PlaygroundProvider>
      <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch animate-scale-up">
        {/* Coluna Esquerda: Editor de Payload */}
        <div className="flex-1 flex flex-col gap-6 lg:min-w-[500px]">
          <PayloadStudio />
          <ContractCoverageDashboard />
        </div>

        {/* Coluna Direita: Simulador, Validador, Inspetor e Ponte */}
        <div className="flex-1 flex flex-col gap-6">
          <ContractValidator />
          <EngineSimulator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <APIInspector />
            <MuseScoreBridgeMock />
          </div>
        </div>
      </div>
    </PlaygroundProvider>
  );
}
