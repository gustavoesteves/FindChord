import { useState } from "react";
import SuiteDomainOutlet from "./components/SuiteDomainOutlet";
import SuiteDomainSwitcher from "./components/SuiteDomainSwitcher";
import SuiteFooter from "./components/SuiteFooter";
import SuiteHeader from "./components/SuiteHeader";
import { SUITE_DOMAINS, type SuiteDomain } from "./SuiteDomain";

export default function SuiteShell() {
  const [activeDomain, setActiveDomain] = useState<SuiteDomain>(SUITE_DOMAINS.writer);

  const domainSwitcher = (
    <SuiteDomainSwitcher
      activeDomain={activeDomain}
      onSelectDomain={setActiveDomain}
    />
  );

  return (
    <div className="min-h-screen bg-stage-lights flex flex-col transition-colors duration-300">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 md:gap-8 box-border">
        <SuiteHeader />

        <div className="w-full flex justify-start -mb-2 relative z-20">
          {domainSwitcher}
        </div>

        <SuiteDomainOutlet
          activeDomain={activeDomain}
          onNavigateToWriter={() => setActiveDomain(SUITE_DOMAINS.writer)}
        />
      </div>

      <SuiteFooter />
    </div>
  );
}
