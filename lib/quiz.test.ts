import { describe, expect, it } from 'vitest';
import { allQuestions, normalizeParticipantName, isNameAllowed, quizSections } from './quiz';

describe('quiz helpers', () => {
  it('normalizes the participant name for duplicate checks', () => {
    expect(normalizeParticipantName('  Maria João  ')).toBe('maria joao');
  });

  it('rejects duplicates based on normalized names', () => {
    const taken = new Set(['maria joao', 'ana paula']);

    expect(isNameAllowed('Maria João', taken)).toBe(false);
    expect(isNameAllowed('Pedro', taken)).toBe(true);
  });

  it('removes the relationship question from the public quiz flow', () => {
    const relationshipKeys = allQuestions.filter((question) => question.key === 'relationship');

    expect(relationshipKeys).toHaveLength(0);
    expect(quizSections.every((section) => !section.questions.some((question) => question.key === 'relationship'))).toBe(true);
  });
});
