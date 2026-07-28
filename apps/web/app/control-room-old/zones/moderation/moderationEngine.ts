/**
 * UBOS Moderation Engine — Step 61
 *
 * Evaluates moderation items against a rule set and returns an
 * enriched item with detected violations, a reason string, and
 * a severity classification.
 *
 * This is a deterministic placeholder engine.
 * Later steps replace it with:
 *   - AI Crew ML toxicity detection
 *   - Platform-specific rule sets
 *   - Operator-defined custom rules
 *   - Automation trigger hooks
 */

export type ModerationRule =
  | 'hate_speech'
  | 'spam'
  | 'excessive_length'
  | 'velocity_spike'
  | 'url_detected'
  | 'caps_abuse';

export type ModerationSeverity = 'normal' | 'flagged' | 'critical';

export type ModerationInput = {
  id: string;
  user: string;
  platform: string;
  time: string;
  text: string;
  velocity?: number;
  avatar?: string;
};

export type EvaluatedItem = ModerationInput & {
  rules: ModerationRule[];
  reason: string;
  severity: ModerationSeverity;
};

export function evaluateModerationRules(item: ModerationInput): EvaluatedItem {
  const rules: ModerationRule[] = [];

  if (/hate|slur|racist/i.test(item.text)) {
    rules.push('hate_speech');
  }

  if (/spam|https?:|buy now|click here/i.test(item.text)) {
    rules.push('spam');
  }

  if (item.text.length > 300) {
    rules.push('excessive_length');
  }

  if ((item.velocity ?? 0) > 10) {
    rules.push('velocity_spike');
  }

  if (/https?:\/\//i.test(item.text)) {
    rules.push('url_detected');
  }

  const upperCount = (item.text.match(/[A-Z]/g) ?? []).length;
  if (upperCount > item.text.length * 0.7 && item.text.length > 10) {
    rules.push('caps_abuse');
  }

  const reason = rules.length > 0 ? rules.join(', ') : 'none';

  const severity: ModerationSeverity =
    rules.includes('hate_speech') ? 'critical'
    : rules.length > 0           ? 'flagged'
    : 'normal';

  return { ...item, rules, reason, severity };
}
