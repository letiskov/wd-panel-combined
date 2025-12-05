// Simple front-end only login just to gate the dashboard UI.
// WARNING: this is not secure for production, but fine for internal panel use.

const USERNAME = "aldhi";
const PASSWORD = "kontolkecap";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const username = String(data.get("username") || "").trim();
    const password = String(data.get("password") || "").trim();

    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem("wd-auth", "ok");
      window.location.href = "/dashboard.html";
    } else {
      errorEl.textContent = "Invalid username or password.";
    }
  });
});
