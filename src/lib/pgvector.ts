// src/lib/pgvector.ts (optional helper)
export function toVectorText(arr: number[]) {
  // pgvector expects bracket form like: [0.12,0.34,...]
  // No quotes here; we pass it as a parameter and CAST in SQL.
  return `[${arr.join(",")}]`;
}
