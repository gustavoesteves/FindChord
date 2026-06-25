import type { SoftWorld, StructuralProfile } from "../models/NarrativeWorld";
import type { HarmonicCluster, SectionHarmonicField } from "../models/HarmonicField";
import { ProjectionResolver } from "./ProjectionResolver";

export class HarmonicFieldClusteringEngine {
  
  /**
   * Compresses a continuous space of SoftWorlds into navigatable Perceptual Clusters.
   */
  public static buildField(sectionId: string, worlds: SoftWorld[]): SectionHarmonicField {
    if (worlds.length === 0) {
      return {
        sectionId,
        rawSpaceSize: 0,
        worlds: [],
        clusters: [],
        previewSet: []
      };
    }

    // 1. Group worlds by similar structural profile
    // A simple threshold-based clustering around dominant features
    const rawClusters = this.clusterWorlds(worlds);

    // 2. Refine clusters and pick representatives
    const clusters: HarmonicCluster[] = rawClusters.map((cluster, i) => {
      const centroid = this.calculateCentroid(cluster.worlds);
      const name = this.generateClusterName(centroid);
      const density = cluster.worlds.length / worlds.length;

      // Sort by distance to centroid and coherence score to pick the best representatives
      const sortedWorlds = [...cluster.worlds].sort((a, b) => {
        // We want the most coherent examples that are also close to the core intent of the cluster
        const distA = this.euclideanDistance(a.structuralProfile, centroid);
        const distB = this.euclideanDistance(b.structuralProfile, centroid);
        
        // Lower distance is better, higher coherence is better
        const scoreA = a.coherenceScore - (distA * 0.5);
        const scoreB = b.coherenceScore - (distB * 0.5);
        
        return scoreB - scoreA;
      });

      // Top 5 representatives projected for the UI
      const representativeWorlds: ProjectionSet[] = sortedWorlds.slice(0, 5).map(w => {
        const units = ProjectionResolver.resolve(w);
        return {
          melody: units.map(u => u.melodicAnchor),
          worlds: [w],
          projections: units,
          transitions: []
        };
      });

      // Calculate variance (average distance to centroid)
      const variance = cluster.worlds.reduce((sum, w) => sum + this.euclideanDistance(w.structuralProfile, centroid), 0) / cluster.worlds.length;

      return {
        id: `cluster_${i + 1}_${name.replace(/\s+/g, '_').toLowerCase()}`,
        name,
        centroid,
        density,
        worlds: sortedWorlds,
        representativeWorlds,
        internalVariance: variance,
        perceptualLabel: {
          diatonicWeight: centroid.diatonicStability,
          dominantWeight: centroid.dominantDensity,
          modalWeight: centroid.modalAmbiguity,
          chromaticWeight: centroid.chromaticDisruption
        }
      };
    });

    // Sort clusters by density descending
    clusters.sort((a, b) => b.density - a.density);

    return {
      sectionId,
      rawSpaceSize: worlds.length,
      worlds,
      clusters,
      previewSet: clusters.length > 0 ? clusters[0].representativeWorlds : []
    };
  }

  /**
   * Adaptive threshold-based clustering.
   * Since our space is bounded [0,1]^4, we can group by the dominant dimension
   * or use a simplified distance cutoff.
   */
  private static clusterWorlds(worlds: SoftWorld[]): { worlds: SoftWorld[] }[] {
    const clusters: { centroid: StructuralProfile, worlds: SoftWorld[] }[] = [];
    const DISTANCE_THRESHOLD = 0.4; // Max distance to join a cluster

    for (const world of worlds) {
      let bestCluster = null;
      let minDistance = Infinity;

      for (const cluster of clusters) {
        const dist = this.euclideanDistance(world.structuralProfile, cluster.centroid);
        if (dist < minDistance) {
          minDistance = dist;
          bestCluster = cluster;
        }
      }

      if (bestCluster && minDistance <= DISTANCE_THRESHOLD) {
        bestCluster.worlds.push(world);
        // Recalculate centroid slightly (moving average approximation)
        bestCluster.centroid = this.calculateCentroid(bestCluster.worlds);
      } else {
        // Create new cluster
        clusters.push({
          centroid: { ...world.structuralProfile },
          worlds: [world]
        });
      }
    }

    return clusters;
  }

  private static euclideanDistance(p1: StructuralProfile, p2: StructuralProfile): number {
    return Math.sqrt(
      Math.pow(p1.diatonicStability - p2.diatonicStability, 2) +
      Math.pow(p1.dominantDensity - p2.dominantDensity, 2) +
      Math.pow(p1.modalAmbiguity - p2.modalAmbiguity, 2) +
      Math.pow(p1.chromaticDisruption - p2.chromaticDisruption, 2)
    );
  }

  private static calculateCentroid(worlds: SoftWorld[]): StructuralProfile {
    if (worlds.length === 0) {
      return { diatonicStability: 0, dominantDensity: 0, modalAmbiguity: 0, chromaticDisruption: 0 };
    }

    let totalWeight = 0;
    const sum = worlds.reduce((acc, w) => {
      // Weight the contribution by the world's coherence score
      const weight = Math.max(0.01, w.coherenceScore); // ensure minimum non-zero weight
      totalWeight += weight;

      acc.diatonicStability += w.structuralProfile.diatonicStability * weight;
      acc.dominantDensity += w.structuralProfile.dominantDensity * weight;
      acc.modalAmbiguity += w.structuralProfile.modalAmbiguity * weight;
      acc.chromaticDisruption += w.structuralProfile.chromaticDisruption * weight;
      return acc;
    }, { diatonicStability: 0, dominantDensity: 0, modalAmbiguity: 0, chromaticDisruption: 0 });

    return {
      diatonicStability: sum.diatonicStability / totalWeight,
      dominantDensity: sum.dominantDensity / totalWeight,
      modalAmbiguity: sum.modalAmbiguity / totalWeight,
      chromaticDisruption: sum.chromaticDisruption / totalWeight
    };
  }

  private static generateClusterName(centroid: StructuralProfile): string {
    // Determine the descriptive label based on the centroid's dominant features
    if (centroid.diatonicStability >= 0.7) return "Estabilidade Diatônica";
    if (centroid.chromaticDisruption >= 0.5) return "Zona Cromática de Alta Tensão";
    if (centroid.modalAmbiguity >= 0.5) return "Região Modal Ambígua";
    if (centroid.dominantDensity >= 0.5) return "Campo Dominante Expandido";
    
    // Mixed edge cases
    if (centroid.diatonicStability >= 0.4 && centroid.modalAmbiguity >= 0.3) return "Intercâmbio Modal Híbrido";
    if (centroid.dominantDensity >= 0.4 && centroid.chromaticDisruption >= 0.3) return "Tensão Dominante Alterada";
    
    return "Região de Coerência Híbrida";
  }
}
