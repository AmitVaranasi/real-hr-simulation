/**
 * Setup for the jsdom ("dom") vitest project only — see vitest.config.ts.
 *
 * Unmounts between tests so a component that registers listeners or timers
 * cannot leak into the next case, which is the usual source of component
 * suites that pass alone and fail in a run.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
