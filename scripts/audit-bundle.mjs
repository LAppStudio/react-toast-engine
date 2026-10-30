import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SEVERITIES = ["info", "low", "moderate", "high", "critical"];
const CODE_EXTENSIONS = [".js", ".cjs", ".mjs"];

const IMPORT_PATTERNS = [
  /\bfrom\s*["']([^"'./][^"']*)["']/g,
  /\bimport\s*["']([^"'./][^"']*)["']/g,
  /\bimport\(\s*["']([^"'./][^"']*)["']\s*\)/g,
  /\brequire\(\s*["']([^"'./][^"']*)["']\s*\)/g,
];

const parseArgs = (argv) => {
  const options = { level: "low", input: undefined, deep: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--deep") options.deep = true;
    else if (arg === "--level") options.level = argv[++index];
    else if (arg === "--input") options.input = argv[++index];
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!SEVERITIES.includes(options.level)) {
    throw new Error(`--level must be one of: ${SEVERITIES.join(", ")}`);
  }
  return options;
};

const toPackageName = (specifier) => {
  if (specifier.startsWith("node:")) return undefined;
  const [scope, name] = specifier.split("/");
  return scope.startsWith("@") ? `${scope}/${name}` : scope;
};

const listDistFiles = () => {
  if (!existsSync(DIST)) {
    throw new Error("dist/ not found. Run `yarn build` first.");
  }
  return readdirSync(DIST).map((file) => join(DIST, file));
};

const collectImportedPackages = (files) => {
  const packages = new Set();
  files
    .filter((file) => CODE_EXTENSIONS.some((extension) => file.endsWith(extension)))
    .forEach((file) => {
      const code = readFileSync(file, "utf8");
      IMPORT_PATTERNS.forEach((pattern) => {
        for (const [, specifier] of code.matchAll(pattern)) {
          const name = toPackageName(specifier);
          if (name) packages.add(name);
        }
      });
    });
  return packages;
};

const collectInlinedPackages = (files) => {
  const packages = new Set();
  files
    .filter((file) => file.endsWith(".map"))
    .forEach((file) => {
      const { sources = [] } = JSON.parse(readFileSync(file, "utf8"));
      sources.forEach((source) => {
        const match = source.match(/.*node_modules\/((?:@[^/]+\/)?[^/]+)/);
        if (match) packages.add(match[1]);
      });
    });
  return packages;
};

const findPackageDir = (name, fromDir) => {
  let current = fromDir;
  while (true) {
    const candidate = join(current, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return candidate;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
};

const collectProductionClosure = (roots) => {
  const visited = new Set();
  const queue = [...roots].map((name) => ({ name, fromDir: ROOT }));
  while (queue.length > 0) {
    const { name, fromDir } = queue.shift();
    const dir = findPackageDir(name, fromDir);
    if (!dir || visited.has(dir)) continue;
    visited.add(dir);
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    Object.keys(manifest.dependencies ?? {}).forEach((dependency) =>
      queue.push({ name: dependency, fromDir: dir }),
    );
  }
  return new Set(
    [...visited].map(
      (dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name,
    ),
  );
};

const readAuditLines = (input) => {
  const output = input
    ? readFileSync(resolve(input), "utf8")
    : spawnSync("yarn", ["audit", "--json"], {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
        shell: process.platform === "win32",
      }).stdout;
  return output
    .split("\n")
    .filter((line) => line.trim().startsWith("{"))
    .map((line) => JSON.parse(line));
};

const collectAdvisories = (lines) => {
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

const describeOrigin = (name, manifest, imported, inlined) => {
  if (manifest.dependencies?.[name]) {
    return `dependency ${manifest.dependencies[name]}`;
  }
  if (manifest.peerDependencies?.[name]) {
    return `peer ${manifest.peerDependencies[name]}`;
  }
  if (inlined.has(name)) return "inlined into dist";
  if (imported.has(name)) return "imported by dist";
  return "transitive";
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const files = listDistFiles();
  const imported = collectImportedPackages(files);
  const inlined = collectInlinedPackages(files);
  const direct = new Set([
    ...imported,
    ...inlined,
    ...Object.keys(manifest.dependencies ?? {}),
  ]);
  const shipped = options.deep ? collectProductionClosure(direct) : direct;
  direct.forEach((name) => shipped.add(name));

  const advisories = collectAdvisories(readAuditLines(options.input));
  const threshold = SEVERITIES.indexOf(options.level);
  const relevant = advisories.filter(({ module }) => shipped.has(module));
  const failing = relevant.filter(
    ({ severity }) => SEVERITIES.indexOf(severity) >= threshold,
  );

  console.log(
    `Bundle packages (${direct.size}): ${[...direct].sort().join(", ") || "none"}`,
  );
  if (options.deep) {
    console.log(`Including production dependencies: ${shipped.size} packages`);
  }
  console.log(
    `Advisories: ${advisories.length} total, ${advisories.length - relevant.length} ignored (not in the bundle), ${relevant.length} in the bundle`,
  );

  relevant.forEach((advisory) => {
    console.log(
      [
        "",
        `[${advisory.severity}] ${advisory.module}@${[...advisory.versions].join(", ")}: ${advisory.title}`,
        `  origin:     ${describeOrigin(advisory.module, manifest, imported, inlined)}`,
        `  vulnerable: ${advisory.vulnerable}`,
        `  patched:    ${advisory.patched}`,
        `  path:       ${[...advisory.paths][0]}`,
        `  more info:  ${advisory.url}`,
      ].join("\n"),
    );
  });

  if (failing.length > 0) {
    const plural = failing.length !== 1;
    console.log(
      `\n${failing.length} advisor${plural ? "ies" : "y"} at or above "${options.level}" ${plural ? "affect" : "affects"} the bundle.`,
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
