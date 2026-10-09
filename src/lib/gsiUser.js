// Reads the logged-in user profile from localStorage under the "gsiUser" key.
// Backward-compat: if "gsiUser" is missing but the legacy "n8nUser" key exists,
// copy it over and remove the old key so existing sessions keep working.
// Object shape is unchanged: { employeeId, username, role, team }.
export function getGsiUser() {
  try {
    let raw = localStorage.getItem("gsiUser");
    if (!raw) {
      const legacy = localStorage.getItem("n8nUser");
      if (legacy) {
        localStorage.setItem("gsiUser", legacy);
        localStorage.removeItem("n8nUser");
        raw = legacy;
      }
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}