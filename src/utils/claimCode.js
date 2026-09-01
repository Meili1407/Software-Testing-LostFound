const CODE_PREFIX = "CLM-";

function formatClaimCode(claimNumber) {
  return `${CODE_PREFIX}${String(claimNumber).padStart(5, "0")}`;
}

function parseClaimCode(code) {
  const match = /^CLM-(\d+)$/i.exec(String(code).trim());
  return match ? Number(match[1]) : null;
}

module.exports = { formatClaimCode, parseClaimCode };
