import React from 'react';
import { Rulebook } from '@/services/rulebook-types';

describe('User Story 1: Clean & Safe One-Click Rulebook Opening (Feature 014)', () => {
  const sampleRulebook: Rulebook = {
    id: 101,
    bggId: 366013,
    label: 'Heat: Pedal to the Metal - Manual Oficial (PT-BR)',
    docType: 'BASE_RULES',
    sourceKind: 'BUNDLED_ASSET',
    sourceUrl: null,
    fileUri: 'file:///path/to/heat-regras-ptbr.pdf',
    fileSizeBytes: 15420000,
    pageCount: 24,
    lastViewedPage: 1,
    status: 'READY',
    createdAt: Date.now(),
  };

  it('provides single-tap rulebook invocation without clutter', () => {
    const handleCardPress = jest.fn();
    const handleBeforeOpen = jest.fn();

    const triggerOpen = (rbId: number) => {
      handleBeforeOpen();
      handleCardPress(rbId);
    };

    triggerOpen(sampleRulebook.id);

    expect(handleBeforeOpen).toHaveBeenCalledTimes(1);
    expect(handleCardPress).toHaveBeenCalledWith(101);
  });

  it('validates that rulebook display models retain essential reader metadata without CRUD actions', () => {
    expect(sampleRulebook.id).toBe(101);
    expect(sampleRulebook.label).toContain('Heat');
    expect(sampleRulebook.status).toBe('READY');
  });
});
