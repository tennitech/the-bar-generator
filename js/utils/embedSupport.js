/* Read capabilities only. The embedding host owns sandbox and Permissions Policy. */
(function (root) {
  function isEmbedded() {
    try { return root.self !== root.top; } catch (_) { return true; }
  }
  function clipboardBlocked() {
    const policy = root.document?.permissionsPolicy || root.document?.featurePolicy;
    if (typeof policy?.allowsFeature !== 'function') return false;
    try {
      // Unknown directives are not proof of a blocked capability.
      if (typeof policy.features === 'function' && !policy.features().includes('clipboard-write')) return false;
      return policy.allowsFeature('clipboard-write') === false;
    } catch (_) { return false; }
  }
  const api = { isEmbedded, clipboardBlocked };
  root.embedSupport = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
