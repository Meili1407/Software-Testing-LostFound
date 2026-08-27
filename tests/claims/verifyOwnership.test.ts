import { describe, it } from 'node:test';
import assert from 'node:assert';
import { verifyOwnership } from '../../src/claims/verifyOwnership.js';
import type { ClaimRequest } from '../../src/types/claim.js';

describe('verifyOwnership', () => {
  it('should return false for no evidence', () => {
    const claim = {
      id: '1',
      foundItemId: '1',
      studentId: '1',
      status: 'PENDING',
      evidence: [],
      submittedAt: new Date()
    } as ClaimRequest;

    const result = verifyOwnership(claim);
    assert.strictEqual(result.isSufficient, false);
    assert.strictEqual(result.score, 0);
  });

  it('should return true for SERIAL_NUMBER evidence', () => {
    const claim = {
      id: '1',
      foundItemId: '1',
      studentId: '1',
      status: 'PENDING',
      evidence: [{
        id: 'ev1',
        claimId: '1',
        evidenceType: 'SERIAL_NUMBER',
        description: 'Serial number 12345',
        submittedAt: new Date()
      }],
      submittedAt: new Date()
    } as ClaimRequest;

    const result = verifyOwnership(claim);
    assert.strictEqual(result.isSufficient, true);
    assert.strictEqual(result.score, 50);
  });

  it('should return true for combined PHOTO and IDENTIFYING_MARKS (50 pts)', () => {
    const claim = {
      id: '1',
      foundItemId: '1',
      studentId: '1',
      status: 'PENDING',
      evidence: [
        {
          id: 'ev1',
          claimId: '1',
          evidenceType: 'PHOTO',
          description: 'Photo of the item',
          submittedAt: new Date()
        },
        {
          id: 'ev2',
          claimId: '1',
          evidenceType: 'IDENTIFYING_MARKS',
          description: 'Scratch on the back',
          submittedAt: new Date()
        }
      ],
      submittedAt: new Date()
    } as ClaimRequest;

    const result = verifyOwnership(claim);
    assert.strictEqual(result.isSufficient, true);
    assert.strictEqual(result.score, 50); // 30 + 20
  });

  it('should return false for only IDENTIFYING_MARKS (20 pts)', () => {
    const claim = {
      id: '1',
      foundItemId: '1',
      studentId: '1',
      status: 'PENDING',
      evidence: [{
        id: 'ev1',
        claimId: '1',
        evidenceType: 'IDENTIFYING_MARKS',
        description: 'Small dent',
        submittedAt: new Date()
      }],
      submittedAt: new Date()
    } as ClaimRequest;

    const result = verifyOwnership(claim);
    assert.strictEqual(result.isSufficient, false);
    assert.strictEqual(result.score, 20);
  });
});
