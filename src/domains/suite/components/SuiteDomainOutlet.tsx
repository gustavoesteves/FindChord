import { lazy, Suspense } from "react";
import { SUITE_DOMAINS, type SuiteDomain } from "../SuiteDomain";

const HarmonizerScreen = lazy(() => import("../../harmonizer/HarmonizerScreen"));
const WriterScreen = lazy(() => import("../../writer/WriterScreen"));

interface SuiteDomainOutletProps {
  activeDomain: SuiteDomain;
  onNavigateToWriter: () => void;
}

export default function SuiteDomainOutlet({
  activeDomain,
  onNavigateToWriter
}: SuiteDomainOutletProps) {
  const fallback = (
    <div className="min-h-80 rounded-lg border border-zinc-800/70 bg-zinc-950/40 animate-pulse" />
  );

  if (activeDomain === SUITE_DOMAINS.harmonizer) {
    return (
      <Suspense fallback={fallback}>
        <div className="animate-scale-up">
          <HarmonizerScreen onNavigateToWriter={onNavigateToWriter} />
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <div className="animate-scale-up">
        <WriterScreen />
      </div>
    </Suspense>
  );
}
