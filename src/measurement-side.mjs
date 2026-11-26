// Pure geometry helper. No storage, UI or inventory side effects.
export function splitMeasurementSide(length, depth) {
  if (!Number.isSafeInteger(length) || length <= 0 || !Number.isFinite(depth) || depth <= 0) throw new RangeError("Invalid side dimensions");
  const parts = [];
  for (let remaining = length; remaining > 0;) {
    const size = Math.min(remaining, 3000);
    parts.push({ length: size, depth });
    remaining -= size;
  }
  return parts;
}
