import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  collectAdvisories,
  isAtOrAbove,
  readAuditLines,
  SEVERITIES,
} from "./yarn-audit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWLIST = join(ROOT, "audit-allowlist.json");
const REQUIRED_FIELDS = ["id", "package", "reason", "affects", "reviewBy"];

const parseArgs = (argv) => {
  const options = { level: "low", input: undefined, today: new Date() };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--level") options.level = argv[++index];
    else if (arg === "--input") options.input = argv[++index];
    else if (arg === "--today") options.today = new Date(argv[++index]);
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!SEVERITIES.includes(options.level)) {
    throw new Error(`--level must be one of: ${SEVERITIES.join(", ")}`);
  }
  if (Number.isNaN(options.today.getTime())) {
    throw new Error("--today must be a date, such as 2026-11-17");
  }
  return options;
};

const readAllowlist = () => {
  const { advisories = [] } = JSON.parse(readFileSync(ALLOWLIST, "utf8"));
  const seen = new Set();
  advisories.forEach((entry, index) => {
    const label = `audit-allowlist.json advisories[${index}]`;
    const missing = REQUIRED_FIELDS.filter((field) => !entry[field]);
    if (missing.length > 0) {
      throw new Error(`${label} is missing: ${missing.join(", ")}`);
    }
    if (!Number.isInteger(entry.id)) {
      throw new Error(`${label}.id must be the numeric advisory id`);
    }
    if (Number.isNaN(new Date(entry.reviewBy).getTime())) {
      throw new Error(`${label}.reviewBy must be a date, such as 2027-02-17`);
    }
    if (seen.has(entry.id)) {
      throw new Error(`${label} repeats advisory ${entry.id}`);
    }
    seen.add(entry.id);
  });
  return new Map(advisories.map((entry) => [entry.id, entry]));
};

const classify = (advisory, entry, today) => {
  if (!entry) return { allowed: false };
  if (entry.package !== advisory.module) {
    return {
      allowed: false,
      note: `allow-listed for "${entry.package}", but the advisory is for "${advisory.module}"`,
    };
  }
  if (new Date(entry.reviewBy) < today) {
    return {
      allowed: false,
      note: `allow-list entry expired on ${entry.reviewBy}; review it and update reviewBy or remove it`,
    };
  }
  return { allowed: true };
};

const describe = (advisory, lines) =>
  [
    "",
    `[${advisory.severity}] ${advisory.module}@${[...advisory.versions].join(", ")}: ${advisory.title}`,
    `  id:         ${advisory.id}`,
    ...lines,
    `  vulnerable: ${advisory.vulnerable}`,
    `  patched:    ${advisory.patched}`,
    `  path:       ${[...advisory.paths][0]}`,
    `  more info:  ${advisory.url}`,
  ].join("\n");

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const allowlist = readAllowlist();
  const advisories = collectAdvisories(readAuditLines(ROOT, options.input));

  const results = advisories.map((advisory) => ({
    advisory,
    entry: allowlist.get(advisory.id),
    ...classify(advisory, allowlist.get(advisory.id), options.today),
  }));
  const allowed = results.filter(({ allowed }) => allowed);
  const reported = results.filter(({ allowed }) => !allowed);
  const failing = reported.filter(({ advisory }) =>
    isAtOrAbove(advisory.severity, options.level),
  );
  const unused = [...allowlist.values()].filter(
    ({ id }) => !advisories.some((advisory) => advisory.id === id),
  );

  console.log(
    `Advisories: ${advisories.length} total, ${allowed.length} allow-listed, ${reported.length} not allow-listed`,
  );

  allowed.forEach(({ advisory, entry }) => {
    console.log(
      describe(advisory, [
        `  allowed:    ${entry.reason}`,
        `  affects:    ${entry.affects}`,
        `  review by:  ${entry.reviewBy}`,
      ]),
    );
  });

  reported.forEach(({ advisory, note }) => {
    console.log(describe(advisory, note ? [`  not allowed: ${note}`] : []));
  });

  unused.forEach(({ id, package: name }) => {
    console.log(
      `\nAllow-list entry ${id} (${name}) no longer appears in the audit and can be removed.`,
    );
  });

  if (failing.length > 0) {
    const plural = failing.length !== 1;
    console.log(
      `\n${failing.length} advisor${plural ? "ies" : "y"} at or above "${options.level}" ${plural ? "are" : "is"} not allow-listed.`,
    );
    process.exitCode = 1;
  }
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
