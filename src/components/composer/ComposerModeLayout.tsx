import React from 'react';
import { ComposerControls } from './ComposerControls';
import { ActiveRoutePanel } from './ActiveRoutePanel';
import { RouteFeed } from './RouteFeed';
import { ExplorationHistoryView } from './ExplorationHistoryView';
import type { RawMelodyNote } from '../../utils/music/generation/engines/melodyExtractionEngine';
import type { CanonicalChordEvent } from '../../utils/music/analysis/models/CanonicalChordEvent';

import { StandardLayout } from '../ui/StandardLayout';

// Mock data for the prototype
const MOCK_NOTES: RawMelodyNote[] = [
  { noteName: 'C4', midiNote: 60, duration: 1.0, isOnStrongBeat: true },
  { noteName: 'E4', midiNote: 64, duration: 1.0, isOnStrongBeat: false },
  { noteName: 'G4', midiNote: 67, duration: 2.0, isOnStrongBeat: true }
];

const MOCK_CHORDS: CanonicalChordEvent[] = [
  { id: '1', symbol: 'C', voicing: { notes: [48, 52, 55] }, onset: 0, duration: 4, functionalLabel: 'T' } as unknown as CanonicalChordEvent,
  { id: '2', symbol: 'Am', voicing: { notes: [45, 48, 52] }, onset: 4, duration: 4, functionalLabel: 'T' } as unknown as CanonicalChordEvent,
  { id: '3', symbol: 'G7', voicing: { notes: [43, 47, 50, 53] }, onset: 8, duration: 4, functionalLabel: 'D' } as unknown as CanonicalChordEvent
];

export const ComposerModeLayout: React.FC = () => {
  const originalChordStrings = MOCK_CHORDS.map(c => c.symbol);

  return (
    <StandardLayout>
      <div className="w-full flex gap-8">
        {/* Left Sidebar: Controls & Context */}
        <ComposerControls 
          originalChords={MOCK_CHORDS} 
          rawNotes={MOCK_NOTES} 
        />
        
        {/* Right Main Area: History, Active Route, Feed */}
        <div className="flex-1 min-w-0 flex flex-col">
          <ExplorationHistoryView />
          <ActiveRoutePanel originalChords={originalChordStrings} />
          <RouteFeed originalChords={originalChordStrings} />
        </div>
      </div>
    </StandardLayout>
  );
};
