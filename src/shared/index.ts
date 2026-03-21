import { Config } from "./types/Config";
import rawConfig from "./config.json";

// Config is bundled at build time by Vite — no runtime file I/O needed.
export const config: Config = rawConfig as Config;
