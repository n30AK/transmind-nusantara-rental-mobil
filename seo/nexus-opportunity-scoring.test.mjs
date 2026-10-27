import assert from "node:assert/strict";
import { scoreOpportunity, classifyOpportunity, validateOpportunity } from "./nexus-opportunity-scoring.js";

assert.equal(scoreOpportunity({businessIntent:1,evidence:1,opportunity:1,confidence:1,safety:1}),1);
assert.deepEqual(classifyOpportunity({businessIntent:1,evidence:1,opportunity:1,confidence:1,safety:1}),{class:"STRIKE_NOW",score:1});
assert.equal(classifyOpportunity({businessIntent:1,evidence:1,opportunity:1,confidence:1,safety:0.9}).class,"BLOCKED");

assert.deepEqual(validateOpportunity({
  hardBlock:false,
  safety:1,
  evidenceTypes:[
    "search_console_or_first_party_signal",
    "page_inventory",
    "intent_alignment",
    "content_differentiation",
    "safety_check"
  ],
  productionMutation:false,
  rollbackRequired:true
}),{
  safe:true,
  hardBlock:false,
  missingEvidence:[],
  productionMutation:false,
  rollback:true
});

assert.equal(validateOpportunity({
  hardBlock:true,
  safety:1,
  evidenceTypes:[
    "search_console_or_first_party_signal",
    "page_inventory",
    "intent_alignment",
    "content_differentiation",
    "safety_check"
  ],
  productionMutation:true,
  rollbackRequired:true
}).safe,false);

console.log("NEXUS opportunity scoring/safety tests: PASS");
