import type { CanonicalProgressionEvent } from '../../analysis/models/CanonicalProgressionEvent';
import { FunctionalIdentityEngine } from './functionalIdentityEngine';
import { HarmonicDNAExtractor } from './HarmonicDNAExtractor';
import { FunctionalArchetypeEngine } from './functionalArchetypeEngine';
import type { OntologicalNode } from '../models/OntologicalNode';

/**
 * Harmonic Ontology Bridge (F14-A0)
 * Translates a discovered progression into a fully classified Semantic Node,
 * establishing its Fingerprint, extracting its DNA, and matching Archetypes.
 */
export class HarmonicOntologyBridge {
  private identityEngine: FunctionalIdentityEngine;
  private dnaExtractor: HarmonicDNAExtractor;
  private archetypeEngine: FunctionalArchetypeEngine;
  
  // Mock Graph Storage
  private ontologyGraph: Map<string, OntologicalNode> = new Map();

  constructor() {
    this.identityEngine = new FunctionalIdentityEngine();
    this.dnaExtractor = new HarmonicDNAExtractor();
    this.archetypeEngine = new FunctionalArchetypeEngine();
  }

  /**
   * Ingests a raw progression event and registers it into the semantic graph.
   */
  public ingestProgression(event: CanonicalProgressionEvent): OntologicalNode {
    // 1. Translation: Create Functional Fingerprint
    const fingerprint = this.identityEngine.calculateFingerprint(event);

    // 2. Extraction: Deduce Harmonic DNA
    const dna = this.dnaExtractor.extract(event, fingerprint);

    // 3. Classification: Match against Archetypes
    const archetypeMatches = this.archetypeEngine.classifyProgression(fingerprint).map(m => ({
      archetypeId: m.archetypeId,
      confidence: m.confidence
    }));

    // Mock Motif extraction (In a full implementation, there would be a FunctionalMotifEngine)
    // For now, we infer motif presence if an archetype is strongly matched
    const motifMatches: { motifId: string, confidence: number }[] = [];
    if (archetypeMatches.length > 0 && archetypeMatches[0].confidence > 0.7) {
      motifMatches.push({
        motifId: `motif_${archetypeMatches[0].archetypeId}`,
        confidence: archetypeMatches[0].confidence * 0.9 // Motif confidence slightly lower than archetype
      });
    }

    // 4. Confidence Matrix
    // DNA confidence is high if we successfully parsed macro strands
    const dnaConfidence = dna.macro.length > 0 ? 0.95 : 0.4;
    const motifConfidence = motifMatches.length > 0 ? motifMatches[0].confidence : 0.0;
    const archetypeConfidence = archetypeMatches.length > 0 ? archetypeMatches[0].confidence : 0.0;

    const node: OntologicalNode = {
      nodeId: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceEvent: event,
      fingerprint,
      dna,
      motifMatches,
      archetypeMatches,
      confidence: {
        dna: dnaConfidence,
        motif: motifConfidence,
        archetype: archetypeConfidence
      }
    };

    // 5. Registration
    this.ontologyGraph.set(node.nodeId, node);

    return node;
  }

  public getGraphNode(nodeId: string): OntologicalNode | undefined {
    return this.ontologyGraph.get(nodeId);
  }
}
