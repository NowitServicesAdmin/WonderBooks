export const isDatabaseSampleId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

// "6-8" -> "Ages 6-8"; "Ages 6-8" stays as is; empty stays empty.
export const sampleAgeLabel = (raw) => {
  const value = String(raw || "").trim();
  if (!value) return "";
  return /^ages?\b/i.test(value) ? value : `Ages ${value}`;
};

export const toSampleCard = (sample) => ({
  id: sample._id,
  title: sample.title,
  category: sample.category,
  age: sampleAgeLabel(sample.age),
  image: sample.coverImageUrl,
  fromDatabase: true,
});