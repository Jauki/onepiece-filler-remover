import { EpisodeType } from "./EpisodeType";

export interface Config {
    knowledgeSrc: string,
    targetSrc: string,
    cacheTTL: number,
    // Background color applied per episode type. null = no color (canon).
    episodeColors: Record<EpisodeType, string | null>,
    // Global episode number where each season starts (1-indexed, season N → index N-1).
    seasonOffsets: number[],
}
