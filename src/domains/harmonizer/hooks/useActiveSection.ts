import { useEffect, useMemo, useState } from "react";
import type { FormalSection } from "../../../store/useScoreSessionStore";

export function useActiveSection(sections: FormalSection[]) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (sections.length > 0) {
      const isValid = sections.some(section => section.id === selectedSectionId);
      if (!selectedSectionId || !isValid) {
        setSelectedSectionId(sections[0].id);
      }
      return;
    }

    if (selectedSectionId) {
      setSelectedSectionId(null);
    }
  }, [sections, selectedSectionId]);

  const activeSection = useMemo(
    () => sections.find(section => section.id === selectedSectionId),
    [sections, selectedSectionId]
  );

  return {
    activeSection,
    selectedSectionId,
    setSelectedSectionId
  };
}
