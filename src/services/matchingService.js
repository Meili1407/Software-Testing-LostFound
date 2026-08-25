const ValidationError = require("../errors/ValidationError");

const WEIGHTS = {
  itemName: 25,
  description: 25,
  color: 15,
  brand: 15,
  location: 10,
  date: 10,
};

const MATCH_RESULT = {
  STRONG: "STRONG_MATCH",
  POSSIBLE: "POSSIBLE_MATCH",
  WEAK: "WEAK_MATCH",
};

const REQUIRED_FIELDS = ["title", "description", "location", "occurredAt"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function toWordSet(value) {
  const normalized = normalizeText(value);
  if (!normalized) return new Set();
  return new Set(normalized.split(/\s+/).filter(Boolean));
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of setA) {
    if (setB.has(word)) intersectionSize += 1;
  }
  const unionSize = setA.size + setB.size - intersectionSize;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function validateItemForMatching(item, label) {
  const errors = [];

  if (!item || typeof item !== "object") {
    throw new ValidationError(`${label} item must be an object.`, [`${label}: missing item`]);
  }

  for (const field of REQUIRED_FIELDS) {
    const value = item[field];
    if (value === undefined || value === null || value === "") {
      errors.push(`${label}: missing required field "${field}"`);
    }
  }

  if (item.occurredAt !== undefined && item.occurredAt !== null) {
    const date = item.occurredAt instanceof Date ? item.occurredAt : new Date(item.occurredAt);
    if (Number.isNaN(date.getTime())) {
      errors.push(`${label}: "occurredAt" is not a valid date`);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(`Invalid ${label} item for matching.`, errors);
  }
}

function scoreItemName(nameA, nameB) {
  const a = normalizeText(nameA);
  const b = normalizeText(nameB);

  if (!a || !b) return 0;
  if (a === b) return WEIGHTS.itemName;
  if (a.includes(b) || b.includes(a)) return Math.round(WEIGHTS.itemName * 0.6);
  return 0;
}

function scoreDescription(descA, descB) {
  const similarity = jaccardSimilarity(toWordSet(descA), toWordSet(descB));
  return Math.round(WEIGHTS.description * similarity);
}

function scoreExactOptionalField(valueA, valueB, weight) {
  const a = normalizeText(valueA);
  const b = normalizeText(valueB);

  if (!a || !b) return 0;
  return a === b ? weight : 0;
}

function scoreLocation(locationA, locationB) {
  const a = normalizeText(locationA);
  const b = normalizeText(locationB);

  if (!a || !b) return 0;
  if (a === b) return WEIGHTS.location;
  if (a.includes(b) || b.includes(a)) return Math.round(WEIGHTS.location * 0.5);
  return 0;
}

function daysBetween(dateA, dateB) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const a = dateA instanceof Date ? dateA : new Date(dateA);
  const b = dateB instanceof Date ? dateB : new Date(dateB);
  return Math.abs(Math.round((a.getTime() - b.getTime()) / msPerDay));
}

function scoreDate(dateA, dateB) {
  const diff = daysBetween(dateA, dateB);

  if (diff === 0) return WEIGHTS.date;
  if (diff <= 3) return Math.round(WEIGHTS.date * 0.5);
  return 0;
}

function classifyScore(score) {
  if (score >= 75) return MATCH_RESULT.STRONG;
  if (score >= 50) return MATCH_RESULT.POSSIBLE;
  return MATCH_RESULT.WEAK;
}

function calculateMatchScore(lostItem, foundItem) {
  validateItemForMatching(lostItem, "lost");
  validateItemForMatching(foundItem, "found");

  const breakdown = {
    itemName: scoreItemName(lostItem.title, foundItem.title),
    description: scoreDescription(lostItem.description, foundItem.description),
    color: scoreExactOptionalField(lostItem.color, foundItem.color, WEIGHTS.color),
    brand: scoreExactOptionalField(lostItem.brand, foundItem.brand, WEIGHTS.brand),
    location: scoreLocation(lostItem.location, foundItem.location),
    date: scoreDate(lostItem.occurredAt, foundItem.occurredAt),
  };

  const rawScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const score = Math.min(100, Math.max(0, rawScore));

  return {
    score,
    result: classifyScore(score),
    breakdown,
  };
}

module.exports = {
  WEIGHTS,
  MATCH_RESULT,
  calculateMatchScore,
  classifyScore,
  validateItemForMatching,
  scoreItemName,
  scoreDescription,
  scoreExactOptionalField,
  scoreLocation,
  scoreDate,
};
