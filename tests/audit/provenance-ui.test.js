const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const vm = require("node:vm")

const sourcePath = path.join(__dirname, "..", "..", "components", "audit", "audit-report-page.tsx")
const source = fs.readFileSync(sourcePath, "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText

const sandbox = {
  exports: {},
  module: { exports: {} },
  require,
  console,
  URL,
  URLSearchParams,
  Intl,
  window: { setInterval() {}, clearInterval() {} },
  fetch: () => {
    throw new Error("fetch should not run in provenance UI tests")
  },
}
sandbox.exports = sandbox.module.exports
vm.runInNewContext(compiled, sandbox, { filename: sourcePath })

const {
  competitiveEmptyCopyForTest,
  geographyProvenanceForTest,
  intentMetricCopyForTest,
  provenanceChipLabelForTest,
  reportDateLabelForTest,
} = sandbox.module.exports

assert.equal(provenanceChipLabelForTest("measured"), "measured")
assert.equal(provenanceChipLabelForTest("inferred"), "inferred")
assert.equal(provenanceChipLabelForTest("estimated"), "estimated")
assert.equal(provenanceChipLabelForTest("recommendation"), "recommendation")
assert.equal(provenanceChipLabelForTest(undefined), null)
assert.equal(provenanceChipLabelForTest({ model: "claude-opus-4-8", version: "4.8" }), null)
assert.equal(provenanceChipLabelForTest("measured_without_source"), null)
assert.equal(geographyProvenanceForTest([], "estimated"), undefined)
assert.equal(geographyProvenanceForTest([{ region: "Austin", count: 12 }], "measured"), "measured")
assert.match(reportDateLabelForTest("2026-06-21T12:00:00.000Z"), /^Scanned on: /)
assert.equal(intentMetricCopyForTest("data_unavailable", 0), "Data unavailable")
assert.match(competitiveEmptyCopyForTest("data_unavailable"), /temporarily unavailable/i)

console.log("provenance UI: 1 passed")
