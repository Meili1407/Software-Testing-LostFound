const { verifyOwnership } = require('../../src/claims/verifyOwnership.js');

describe('verifyOwnership', () => {
  it('should return false for no evidence', () => {
    const claim = {
      id: '1',
      foundItemId: '1',
      studentId: '1',
      status: 'PENDING',
      evidence: [],
      submittedAt: new Date()
    };

    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(false);
    expect(result.score).toBe(0);
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
    };

    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(true);
    expect(result.score).toBe(50);
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
    };

    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(true);
    expect(result.score).toBe(50); // 30 + 20
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
    };

    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(false);
    expect(result.score).toBe(20);
  });

  it('should return false for only RECEIPT (40 pts) - Boundary Value Analysis', () => {
    const claim = {
      id: '1',
      evidence: [{ evidenceType: 'RECEIPT', description: 'Store receipt' }]
    };
    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(false);
    expect(result.score).toBe(40);
  });

  it('should return false for only PHOTO (30 pts)', () => {
    const claim = {
      id: '1',
      evidence: [{ evidenceType: 'PHOTO', description: 'Item picture' }]
    };
    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(false);
    expect(result.score).toBe(30);
  });

  it('should return true for RECEIPT and PHOTO (> 50 pts) - Boundary Value Analysis', () => {
    const claim = {
      id: '1',
      evidence: [
        { evidenceType: 'RECEIPT', description: 'Store receipt' },
        { evidenceType: 'PHOTO', description: 'Item picture' }
      ]
    };
    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(true);
    expect(result.score).toBe(70);
  });

  it('should not crash and award 0 points for unknown evidence type', () => {
    const claim = {
      id: '1',
      evidence: [{ evidenceType: 'UNKNOWN_TYPE', description: 'Weird evidence' }]
    };
    const result = verifyOwnership(claim);
    expect(result.isSufficient).toBe(false);
    expect(result.score).toBe(0);
  });
});
