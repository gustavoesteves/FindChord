import type { UniversalLaw } from '../models/UniversalLaw';
import type { LiteratureEvidence } from '../models/LiteratureEvidence';

export class ScientificLiteratureIntegrationEngine {
  /**
   * Returns a built-in seed database of musicological literature evidence.
   */
  public static getSeedEvidence(): LiteratureEvidence[] {
    return [
      {
        id: 'schenker_1935',
        author: 'Heinrich Schenker',
        work: 'Free Composition',
        year: 1935,
        concepts: ['Stufe', 'Voice Leading', 'Urlinie'],
        supportsLawIds: ['parsimonious_voice_leading'],
        confidence: 0.90,
        supportStrength: 'INDIRECT'
      },
      {
        id: 'schoenberg_1911',
        author: 'Arnold Schoenberg',
        work: 'Theory of Harmony',
        year: 1911,
        concepts: ['Economy of voice-leading', 'Tonality'],
        supportsLawIds: ['parsimonious_voice_leading', 'chromatic_attraction'],
        confidence: 0.85,
        supportStrength: 'INDIRECT'
      },
      {
        id: 'cohn_2012',
        author: 'Richard Cohn',
        work: 'Audacious Euphony',
        year: 2012,
        concepts: ['Parsimonious voice-leading', 'Tonnetz'],
        supportsLawIds: ['parsimonious_voice_leading'],
        confidence: 0.95,
        supportStrength: 'DIRECT'
      },
      {
        id: 'tymoczko_2011',
        author: 'Dmitri Tymoczko',
        work: 'A Geometry of Music',
        year: 2011,
        concepts: ['Voice-leading spaces', 'Symmetry'],
        supportsLawIds: ['parsimonious_voice_leading', 'chromatic_attraction'],
        confidence: 0.95,
        supportStrength: 'DIRECT'
      },
      {
        id: 'lendvai_1971',
        author: 'Ernő Lendvai',
        work: 'Béla Bartók: An Analysis of his Music',
        year: 1971,
        concepts: ['Axis system', 'Symmetry'],
        supportsLawIds: ['chromatic_attraction'],
        confidence: 0.80,
        supportStrength: 'DIRECT'
      },
      {
        id: 'rameau_1722',
        author: 'Jean-Philippe Rameau',
        work: 'Treatise on Harmony',
        year: 1722,
        concepts: ['Basse fondamentale', 'Functional gravity'],
        supportsLawIds: ['functional_resolution'],
        confidence: 0.85,
        supportStrength: 'INDIRECT'
      },
      {
        id: 'riemann_1893',
        author: 'Hugo Riemann',
        work: 'Vereinfachte Harmonielehre',
        year: 1893,
        concepts: ['Funktionstheorie', 'Dominant', 'Subdominant'],
        supportsLawIds: ['functional_resolution'],
        confidence: 0.90,
        supportStrength: 'INDIRECT'
      }
    ];
  }

  /**
   * Computes historical metrics, conceptual metrics, rediscovery status, and global convergence scores.
   *
   * @param laws List of universal laws evaluated in the system.
   * @param fundamentalLawIds List of law IDs that were classified as fundamental in F11-V.
   * @param customEvidence Optional custom database of literature evidence. If omitted, uses the seed evidence.
   */
  public static calculateHistoricalMetrics(
    laws: UniversalLaw[],
    fundamentalLawIds: string[],
    customEvidence?: LiteratureEvidence[]
  ): {
    lawMetrics: Record<
      string,
      {
        hcs: number;
        ccs: number;
        hiri: number;
        authorsCount: number;
        conceptsCount: number;
        isIndependentRediscovery: boolean;
      }
    >;
    globalMetrics: {
      geci: number;
      lcfl: number;
    };
  } {
    const evidence = customEvidence || this.getSeedEvidence();

    // 1. Calculate unique authors and concepts count per law
    const lawDetailsMap: Record<
      string,
      {
        uniqueAuthors: Set<string>;
        uniqueConcepts: Set<string>;
        meanConfidence: number;
        hasDirectSupport: boolean;
      }
    > = {};

    laws.forEach(law => {
      const supportingEvidence = evidence.filter(e => e.supportsLawIds.includes(law.id));
      const uniqueAuthors = new Set(supportingEvidence.map(e => e.author));
      const uniqueConcepts = new Set(supportingEvidence.flatMap(e => e.concepts));
      const meanConfidence = supportingEvidence.length > 0
        ? supportingEvidence.reduce((sum, e) => sum + e.confidence, 0) / supportingEvidence.length
        : 0.0;
      const hasDirectSupport = supportingEvidence.some(e => e.supportStrength === 'DIRECT');

      lawDetailsMap[law.id] = {
        uniqueAuthors,
        uniqueConcepts,
        meanConfidence,
        hasDirectSupport
      };
    });

    // 2. Find max authors and concepts counts among evaluated laws for normalization
    let maxAuthorsCount = 0;
    let maxConceptsCount = 0;

    laws.forEach(law => {
      const details = lawDetailsMap[law.id];
      if (details) {
        maxAuthorsCount = Math.max(maxAuthorsCount, details.uniqueAuthors.size);
        maxConceptsCount = Math.max(maxConceptsCount, details.uniqueConcepts.size);
      }
    });

    // 3. Compute metrics for each law
    const lawMetrics: Record<
      string,
      {
        hcs: number;
        ccs: number;
        hiri: number;
        authorsCount: number;
        conceptsCount: number;
        isIndependentRediscovery: boolean;
      }
    > = {};

    laws.forEach(law => {
      const details = lawDetailsMap[law.id];
      if (!details) return;

      const authorsCount = details.uniqueAuthors.size;
      const conceptsCount = details.uniqueConcepts.size;

      // HCS = N_authors / N_authors,max
      const hcs = maxAuthorsCount > 0 ? authorsCount / maxAuthorsCount : 0.0;

      // CCS = N_concepts / N_concepts,max
      const ccs = maxConceptsCount > 0 ? conceptsCount / maxConceptsCount : 0.0;

      // Class Weight: UNIVERSAL = 1.0, QUASI_UNIVERSAL = 0.8, LOCAL = 0.5
      let classWeight = 0.5;
      if (law.universalityClass === 'UNIVERSAL') {
        classWeight = 1.0;
      } else if (law.universalityClass === 'QUASI_UNIVERSAL') {
        classWeight = 0.8;
      }

      // Support Weight: DIRECT = 1.0, INDIRECT = 0.75, NONE = 0
      let supportWeight = 0.0;
      if (authorsCount > 0) {
        supportWeight = details.hasDirectSupport ? 1.0 : 0.75;
      }

      // HIRI = classWeight * HCS * meanConfidence * supportWeight
      const hiri = classWeight * hcs * details.meanConfidence * supportWeight;

      // Independent Rediscovery if supported by >= 2 distinct authors
      const isIndependentRediscovery = authorsCount >= 2;

      lawMetrics[law.id] = {
        hcs: Number(hcs.toFixed(4)),
        ccs: Number(ccs.toFixed(4)),
        hiri: Number(hiri.toFixed(4)),
        authorsCount,
        conceptsCount,
        isIndependentRediscovery
      };
    });

    // 4. Calculate Global Metrics
    // GECI: proportion of UNIVERSAL/QUASI_UNIVERSAL laws with at least 1 historical author
    const generalLaws = laws.filter(
      l => l.universalityClass === 'UNIVERSAL' || l.universalityClass === 'QUASI_UNIVERSAL'
    );
    const validatedGeneralLawsCount = generalLaws.filter(
      l => (lawDetailsMap[l.id]?.uniqueAuthors.size ?? 0) >= 1
    ).length;
    const geci = generalLaws.length > 0 ? validatedGeneralLawsCount / generalLaws.length : 0.0;

    // LCFL: proportion of fundamental laws with at least 1 historical author
    const fundamentalLaws = laws.filter(l => fundamentalLawIds.includes(l.id));
    const validatedFundamentalCount = fundamentalLaws.filter(
      l => (lawDetailsMap[l.id]?.uniqueAuthors.size ?? 0) >= 1
    ).length;
    const lcfl = fundamentalLaws.length > 0 ? validatedFundamentalCount / fundamentalLaws.length : 0.0;

    return {
      lawMetrics,
      globalMetrics: {
        geci: Number(geci.toFixed(4)),
        lcfl: Number(lcfl.toFixed(4))
      }
    };
  }
}
