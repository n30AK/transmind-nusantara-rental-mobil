import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../nexus/customer-recovery-agent.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context, { filename: "customer-recovery-agent.js" });
const agent = context.TransmindCustomerRecoveryAgent;

test("detects dissatisfaction and requires human review", () => {
  const triage = agent.classifyCustomerDissatisfaction("Saya kecewa dengan pelayanan Transmind.");
  assert.equal(triage.complaint, true);
  assert.equal(triage.humanReviewRequired, true);
  assert.equal(triage.urgent, false);
  assert.match(agent.buildEmpatheticComplaintReply("Saya kecewa dengan pelayanan Transmind."), /turut prihatin/i);
});

test("safety incidents are urgent even without a complaint keyword", () => {
  const triage = agent.classifyCustomerDissatisfaction("Saya mengalami kecelakaan dan terluka.");
  assert.equal(triage.urgent, true);
  assert.equal(triage.humanReviewRequired, true);
  assert.equal(triage.category, "safety");
  assert.match(agent.buildEmpatheticComplaintReply("Saya mengalami kecelakaan dan terluka."), /Keselamatan Anda yang utama/i);
});

test("does not invent compensation and blocks unsupported promises", () => {
  const message = "Saya minta refund karena kecewa.";
  const reply = agent.buildEmpatheticComplaintReply(message);
  assert.match(reply, /tidak ingin menjanjikan refund|tidak akan menjanjikan refund/i);
  assert.equal(agent.validateCustomerRecoveryReply("Refund pasti kami berikan.", message).valid, false);
});

test("ordinary rental questions are not treated as complaints", () => {
  const triage = agent.classifyCustomerDissatisfaction("Apakah Toyota Hiace tersedia untuk 2 hari?");
  assert.equal(triage.complaint, false);
  assert.equal(agent.buildEmpatheticComplaintReply("Apakah Toyota Hiace tersedia untuk 2 hari?"), null);
});
