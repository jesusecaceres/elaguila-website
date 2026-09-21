/** Registers `routeHarnessHooks.mjs`. Used only by `verify-ix-rewards-route-behavior-01.ts`. */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./routeHarnessHooks.mjs", pathToFileURL(import.meta.filename));
