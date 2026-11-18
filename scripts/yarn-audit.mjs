import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

export const SEVERITIES = ["info", "low", "moderate", "high", "critical"];

export const isAtOrAbove = (severity, level) =>
  SEVERITIES.indexOf(severity) >= SEVERITIES.indexOf(level);

export const readAuditLines = (root, input) => {
  const output = input
    ? readFileSync(resolve(input), "utf8")
    : spawnSync("yarn", ["audit", "--json"], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        shell: process.platform === "win32",
      }).stdout;
  return output
    .split("\n")
    .filter((line) => line.trim().startsWith("{"))
    .map((line) => JSON.parse(line));
};

export const collectAdvisories = (lines) => {
  const advisories = new Map();
  lines
    .filter(({ type }) => type === "auditAdvisory")
    .forEach(({ data: { advisory, resolution } }) => {
      const entry = advisories.get(advisory.id) ?? {
        id: advisory.id,
        module: advisory.module_name,
        severity: advisory.severity,
        title: advisory.title,
        vulnerable: advisory.vulnerable_versions,
        patched: advisory.patched_versions,
        url: advisory.url,
        versions: new Set(),
        paths: new Set(),
      };
      advisory.findings.forEach(({ version }) => entry.versions.add(version));
      entry.paths.add(resolution.path);
      advisories.set(advisory.id, entry);
    });
  return [...advisories.values()];
};
