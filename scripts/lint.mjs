import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { transform } from "esbuild";

const execFileAsync = promisify(execFile);
const cwd = process.cwd();
const supportedExtensions = new Set([".js", ".jsx", ".mjs", ".cjs"]);

const getLoaderForFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jsx") return "jsx";
  return "js";
};

const getTrackedSourceFiles = async () => {
  const { stdout } = await execFileAsync("git", ["ls-files"], { cwd });

  return stdout
    .split("\n")
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .filter((filePath) => supportedExtensions.has(path.extname(filePath).toLowerCase()))
    .filter((filePath) => !filePath.startsWith("dist/"))
    .filter((filePath) => !filePath.startsWith("node_modules/"));
};

const hasMergeMarkers = (source) => /^(<<<<<<<|=======|>>>>>>>)/m.test(source);

const lintFile = async (filePath) => {
  const absolutePath = path.resolve(cwd, filePath);
  const source = await fs.readFile(absolutePath, "utf8");

  if (hasMergeMarkers(source)) {
    return `merge conflict marker found in ${filePath}`;
  }

  try {
    await transform(source, {
      loader: getLoaderForFile(filePath),
      sourcefile: filePath,
      logLevel: "silent",
    });
  } catch (error) {
    const details = error?.errors?.[0];
    if (details?.location) {
      return `${filePath}:${details.location.line}:${details.location.column} ${details.text}`;
    }
    return `${filePath} ${error.message || "syntax check failed"}`;
  }

  return null;
};

const run = async () => {
  const files = await getTrackedSourceFiles();

  if (files.length === 0) {
    console.log("No JavaScript files found to lint.");
    return;
  }

  const failures = [];

  for (const filePath of files) {
    const failure = await lintFile(filePath);
    if (failure) failures.push(failure);
  }

  if (failures.length > 0) {
    console.error("Lint failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Lint passed for ${files.length} files.`);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
