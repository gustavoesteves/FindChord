import { useEffect, useMemo, useState } from "react";
import type { FormalSection } from "../../../utils/music/analysis/models/FormalSection";

export function effectiveSectionId(sections: FormalSection[], selectedSectionId: string | null): string | null {
  if (sections.length === 0) return null;
  if (selectedSectionId && sections.some(section => section.id === selectedSectionId)) {
    return selectedSectionId;
  }
  return sections[0].id;
}

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

  const effectiveSelectedSectionId = useMemo(() => {
    return effectiveSectionId(sections, selectedSectionId);
  }, [sections, selectedSectionId]);

  const activeSection = useMemo(
    () => sections.find(section => section.id === effectiveSelectedSectionId),
    [sections, effectiveSelectedSectionId]
  );

  return {
    activeSection,
    selectedSectionId: effectiveSelectedSectionId,
    setSelectedSectionId
  };
}
