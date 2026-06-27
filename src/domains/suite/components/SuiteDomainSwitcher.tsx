import { Compass, PenLine } from "lucide-react";
import { SUITE_DOMAINS, type SuiteDomain } from "../SuiteDomain";

interface SuiteDomainSwitcherProps {
  activeDomain: SuiteDomain;
  onSelectDomain: (domain: SuiteDomain) => void;
}

function domainButtonClass(isActive: boolean) {
  return `flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
    isActive
      ? "bg-purple-600 text-white shadow-md animate-scale-up"
      : "text-zinc-500 hover:text-zinc-350"
  }`;
}

export default function SuiteDomainSwitcher({
  activeDomain,
  onSelectDomain
}: SuiteDomainSwitcherProps) {
  return (
    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 shadow-md">
      <button
        id="domain-escrever"
        onClick={() => onSelectDomain(SUITE_DOMAINS.writer)}
        className={domainButtonClass(activeDomain === SUITE_DOMAINS.writer)}
      >
        <PenLine className="h-3.5 w-3.5" />
        ESCREVER
      </button>
      <button
        id="domain-harmonizar"
        onClick={() => onSelectDomain(SUITE_DOMAINS.harmonizer)}
        className={domainButtonClass(activeDomain === SUITE_DOMAINS.harmonizer)}
      >
        <Compass className="h-3.5 w-3.5" />
        HARMONIZAR
      </button>
    </div>
  );
}
