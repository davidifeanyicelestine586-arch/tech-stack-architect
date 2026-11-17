import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const workflows = [
  ".github/workflows/header-collision-audit.yml",
  ".github/workflows/lighthouse-baseline.yml",
  ".github/workflows/seo-release-verification.yml",
];

test("release verification workflows run on main pushes with the pinned Node runtime", () => {
  for (const file of workflows) {
    const workflow = read(file);
    assert.match(workflow, /on:\s*\n\s+push:\s*\n\s+branches:\s*(?:\[\s*main\s*\]|\n\s+-\s+main)/, `${file} must run on pushes to main`);
    assert.match(workflow, /uses:\s*actions\/setup-node@v4/, `${file} must set up Node explicitly`);
    assert.match(workflow, /node-version:\s*22/, `${file} must use the supported Node 22 runtime`);
  }
});
