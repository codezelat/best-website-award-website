import { participationContent } from '../../data/participation';
import type { PackageCode } from '../participation/policy';
export interface ParticipationContent {
  title: string;
  packages: readonly {
    code: PackageCode;
    title: string;
    description: string;
    benefits: readonly string[];
  }[];
  packageNote: string;
  extraTrophy: string;
  attendeeBenefits: readonly string[];
}
export const getParticipationContent = async (): Promise<ParticipationContent> =>
  participationContent;
