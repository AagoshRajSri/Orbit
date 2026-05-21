export function normalizeConstellation(points) {
  if (!points || !Array.isArray(points) || points.length === 0) return [];
  
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  
  const shifted = points.map(p => ({ x: p.x - minX, y: p.y - minY }));
  const maxX = Math.max(...shifted.map(p => p.x));
  const maxY = Math.max(...shifted.map(p => p.y));
  const maxDim = Math.max(maxX, maxY, 0.001); // Avoid division by zero

  return shifted.map(p => ({
    x: Number((p.x / maxDim).toFixed(3)),
    y: Number((p.y / maxDim).toFixed(3))
  }));
}

export function validateConstellationComplexity(points) {
  if (!points || !Array.isArray(points) || points.length < 5) {
    return { valid: false, reason: 'Fewer than 5 distinct points' };
  }
  
  const distinct = new Set(points.map(p => `${p.x},${p.y}`));
  if (distinct.size < 5) {
    return { valid: false, reason: 'Fewer than 5 distinct points' };
  }

  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x;
    const dy = points[i].y - points[i-1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  if (totalLength < 2.0) {
    return { valid: false, reason: 'Total Euclidean path length is under 2.0 units' };
  }

  return { valid: true };
}
