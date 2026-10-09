#!/usr/bin/env node
import * as esbuild from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "build", "bundle.iife.js");
mkdirSync(dirname(outfile), { recursive: true });

await esbuild.build({
	entryPoints: [join(root, "src", "main.ts")],
	bundle: true,
	format: "iife",
	platform: "browser",
	target: ["es2020"],
	outfile,
	sourcemap: false,
	legalComments: "none",
	logLevel: "info",
});

console.log("Wrote", outfile);
