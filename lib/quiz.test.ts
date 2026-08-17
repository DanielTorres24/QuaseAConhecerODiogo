import { describe, expect, it } from 'vitest';
import { normalizeParticipantName, isNameAllowed } from './quiz';

describe('quiz helpers', () => {
  it('normalizes the participant name for duplicate checks', () => {
    expect(normalizeParticipantName('  Maria João  ')).toBe('maria joao');
  });

  it('rejects duplicates based on normalized names', () => {
    const taken = new Set(['maria joao', 'ana paula']);

    expect(isNameAllowed('Maria João', taken)).toBe(false);
    expect(isNameAllowed('Pedro', taken)).toBe(true);
  });
});
