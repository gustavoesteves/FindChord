import HarmonizerScreen from "../../harmonizer/HarmonizerScreen";
import WriterScreen from "../../writer/WriterScreen";
import { SUITE_DOMAINS, type SuiteDomain } from "../SuiteDomain";

interface SuiteDomainOutletProps {
  activeDomain: SuiteDomain;
  onNavigateToWriter: () => void;
}

export default function SuiteDomainOutlet({
  activeDomain,
  onNavigateToWriter
}: SuiteDomainOutletProps) {
  if (activeDomain === SUITE_DOMAINS.harmonizer) {
    return (
      <div className="animate-scale-up">
        <HarmonizerScreen onNavigateToWriter={onNavigateToWriter} />
      </div>
    );
  }

  return (
    <div className="animate-scale-up">
      <WriterScreen />
    </div>
  );
}
