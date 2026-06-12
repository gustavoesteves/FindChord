export interface ReplicationResult {
  hypothesisId: string;
  testedCorpora: number;
  replicatedCorpora: number;
  replicationScoreWeighted: number;
  status: 'replicated' | 'partial' | 'failed';
}
