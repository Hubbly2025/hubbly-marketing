const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const vm = require("node:vm")

function loadTsModule(relativePath) {
  const sourcePath = path.join(__dirname, "..", "..", relativePath)
  const source = fs.readFileSync(sourcePath, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const sandbox = {
    exports: {},
    module: { exports: {} },
    require,
    process,
  }
  sandbox.exports = sandbox.module.exports
  vm.runInNewContext(compiled, sandbox, { filename: sourcePath })
  return sandbox.module.exports
}

const {
  enabledRankCapabilities,
  enabledRankCapabilityIds,
  isAuditFeatureEnabled,
  RANK_TIER_1_CAPABILITIES,
  RANK_TIER_2_CAPABILITIES,
} = loadTsModule("lib/audit/rank-capabilities.ts")

assert.equal(RANK_TIER_1_CAPABILITIES.length, 4)
assert.equal(JSON.stringify(enabledRankCapabilities({}).map((capability) => capability.id)), JSON.stringify([
  "rank.on_page_optimization",
  "rank.structured_data_schema",
  "rank.aeo_llms_txt",
  "rank.instant_indexing",
]))

assert.equal(RANK_TIER_2_CAPABILITIES[0].flag, "RANK_CONTENT_ENABLED")
assert.equal(RANK_TIER_2_CAPABILITIES[1].flag, "RANK_PUBLISH_ENABLED")

const contentEnabledIds = enabledRankCapabilityIds({ RANK_CONTENT_ENABLED: "true" })
assert.equal(contentEnabledIds.has("rank.content_generation"), true)
assert.equal(contentEnabledIds.has("rank.autonomous_publish"), false)

const publishEnabledIds = enabledRankCapabilityIds({ RANK_PUBLISH_ENABLED: "1" })
assert.equal(publishEnabledIds.has("rank.autonomous_publish"), true)

assert.equal(isAuditFeatureEnabled("BACKLINKS_ENABLED", { BACKLINKS_ENABLED: "on" }), true)
assert.equal(isAuditFeatureEnabled("BACKLINKS_ENABLED", { BACKLINKS_ENABLED: "false" }), false)

console.log("rank capabilities: 1 passed")
