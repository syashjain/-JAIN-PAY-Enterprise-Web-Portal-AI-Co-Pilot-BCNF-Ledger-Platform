import React from 'react';
import { RightPipelineStage } from './RightPipelineStage';
import { FeaturePipelineSpec } from '../data/pipelineMetadata';

export interface RightPipelineCardProps {
  spec: FeaturePipelineSpec;
  lastExecutionSummary: string;
  onInspectInAdminVault: (
    recommendedTab: FeaturePipelineSpec['recommendedAdminTab'],
    recommendedTable?: FeaturePipelineSpec['recommendedBcnfTable']
  ) => void;
}

export const RightPipelineCard: React.FC<RightPipelineCardProps> = (props) => {
  return <RightPipelineStage {...props} />;
};

export { RightPipelineStage };
