export async function authFetch(input, init = {}) {
  const res = await fetch(input, {
    ...init,
    credentials: "include", // send cookies
  });

  // ✅ Check for 401 Unauthorized
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    alert("session Expired please login again")
    return; // Stop here
  }

  return res;
}
