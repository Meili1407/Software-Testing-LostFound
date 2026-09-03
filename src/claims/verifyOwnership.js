function verifyOwnership(claim) {
  let score = 0;
  const messages = [];

  if (!claim.evidence || claim.evidence.length === 0) {
    return {
      isSufficient: false,
      score: 0,
      messages: ["No evidence provided."],
    };
  }

  for (const ev of claim.evidence) {
    switch (ev.evidenceType) {
      case "SERIAL_NUMBER":
        score += 50;
        messages.push(`Added 50 points for SERIAL_NUMBER: ${ev.description}`);
        break;
      case "RECEIPT":
        score += 40;
        messages.push(`Added 40 points for RECEIPT: ${ev.description}`);
        break;
      case "PHOTO":
        score += 30;
        messages.push(`Added 30 points for PHOTO: ${ev.description}`);
        break;
      case "IDENTIFYING_MARKS":
        score += 20;
        messages.push(`Added 20 points for IDENTIFYING_MARKS: ${ev.description}`);
        break;
      default:
        messages.push(`Unknown evidence type provided.`);
        break;
    }
  }

  const isSufficient = score >= 50;
  
  if (isSufficient) {
    messages.push(`Total score is ${score}. Evidence is sufficient (>= 50).`);
  } else {
    messages.push(`Total score is ${score}. Evidence is not sufficient (< 50).`);
  }

  return {
    isSufficient,
    score,
    messages,
  };
}

module.exports = { verifyOwnership };
