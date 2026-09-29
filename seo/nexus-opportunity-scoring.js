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
