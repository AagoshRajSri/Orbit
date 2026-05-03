export const normalizeId = (obj) => {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  return (obj._id || obj.id || '').toString() || null;
};

// Robust matching helper for IDs — handles obfuscated vs raw IDs
export const isMatchObj = (targetId, userObj, usersList = []) => {
  if (!targetId || !userObj) return false;
  const tId = targetId.toString();
  if (typeof userObj === 'string') return userObj === tId;
  if (userObj._id?.toString() === tId) return true;
  if (userObj.id?.toString() === tId) return true;
  
  // Fallback: resolve through users list when formats differ
  return usersList.some(u =>
    (u._id?.toString() === tId || u.id?.toString() === tId) &&
    (u._id?.toString() === normalizeId(userObj) || u.id?.toString() === normalizeId(userObj))
  );
};
