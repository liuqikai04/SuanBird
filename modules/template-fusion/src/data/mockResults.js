import { DEMO_EXAMPLES } from "../config/demoExamples.js";
import { generateFallbackResult } from "../features/generate/fallbackGenerator.js";

export const MOCK_RESULTS = DEMO_EXAMPLES.map((text) => generateFallbackResult(text));
