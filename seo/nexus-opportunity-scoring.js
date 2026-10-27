// Deterministic scoring contract for the NEXUS Aggressive Growth Engine.
// No network access and no production mutation: this module only scores opportunities.
export function scoreOpportunity(input) {
  const clamp = (n) => Math.max(0, Math.min(1, Number(n) || 0));
  const businessIntent = clamp(input.businessIntent);
  const evidence = clamp(input.evidence);
  const opportunity = clamp(input.opportunity);
  const confidence = clamp(input.confidence);
  const safety = clamp(input.safety);
  return Number((businessIntent * evidence * opportunity * confidence * safety).toFixed(6));
}

export function classifyOpportunity(input) {
  const score = scoreOpportunity(input);
  if (input.hardBlock === true || input.safety < 1) return { class: "BLOCKED", score };
  if (score >= 0.65) return { class: "STRIKE_NOW", score };
  if (score >= 0.40) return { class: "TEST", score };
  return { class: "OBSERVE", score };
}

export function validateOpportunity(input) {
  const hardBlock = input.hardBlock === true;
  const requiredEvidence = ["search_console_or_first_party_signal", "page_inventory", "intent_alignment", "content_differentiation", "safety_check"];
  const evidence = new Set(Array.isArray(input.evidenceTypes) ? input.evidenceTypes : []);
  const missingEvidence = requiredEvidence.filter((key) => !evidence.has(key));
  const productionMutation = input.productionMutation === true;
  const rollback = input.rollbackRequired !== false;
  const safe = !hardBlock && input.safety === 1 && missingEvidence.length === 0 && (!productionMutation || rollback);
  return { safe, hardBlock, missingEvidence, productionMutation, rollback };
}
