import browser from "webextension-polyfill";
import { config } from "../shared";
import { EpisodeMap } from "../shared/types/EpisodeMap";

// Only run on the configured target page.
if (location.href.startsWith(config.targetSrc)) {
    init();
}

async function init(): Promise<void> {
    const response = await browser.runtime.sendMessage({ type: "getEpisodeMap" }) as { episodeMap?: EpisodeMap; error?: string };

    if (response.error || !response.episodeMap) {
        console.error("Failed to load episode map:", response.error);
        return;
    }

    colorEpisodes(response.episodeMap);
}

/** Applies background colors to all episode links based on their episode type. */
function colorEpisodes(episodeMap: EpisodeMap): void {
    // Episode links carry a data-season-id attribute; season nav links do not.
    const episodeLinks = document.querySelectorAll<HTMLAnchorElement>("a[data-season-id]");

    for (const link of episodeLinks) {
        const globalEpisode = resolveGlobalEpisode(link);
        if (globalEpisode === null) continue;

        const episodeType = episodeMap[globalEpisode];
        if (!episodeType) continue;

        const color = config.episodeColors[episodeType];
        if (color) link.style.backgroundColor = color;
    }
}

/**
 * Resolves the global (absolute) episode number from an episode link.
 * Uses data-season-id and the episode number parsed from the href.
 */
function resolveGlobalEpisode(link: HTMLAnchorElement): number | null {
    const season = parseInt(link.dataset.seasonId ?? "", 10);
    if (isNaN(season)) return null;

    // href format: /anime/stream/one-piece/staffel-N/episode-M
    const match = link.href.match(/\/episode-(\d+)/);
    if (!match) return null;
    const localEpisode = parseInt(match[1], 10);

    const seasonOffset = config.seasonOffsets[season - 1];
    if (seasonOffset === undefined) return null;

    return seasonOffset + localEpisode - 1;
}
