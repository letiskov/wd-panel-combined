document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("withdraw-table-body");
  const errorEl = document.getElementById("table-error");
  const refreshBtn = document.getElementById("refresh-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // Simple front-end auth check
  if (localStorage.getItem("wd-auth") !== "ok") {
    window.location.href = "/login.html";
    return;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("wd-auth");
      window.location.href = "/login.html";
    });
  }

  async function loadData() {
    if (!tbody) return;

    errorEl.textContent = "";
    tbody.innerHTML = '<tr><td colspan="4" class="loading-row">Loading data...</td></tr>';

    try {
      const res = await fetch("/api/withdraw");
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      const json = await res.json();
      const rows = Array.isArray(json) ? json : json.data;

      if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No data.</td></tr>';
        return;
      }

      tbody.innerHTML = "";

      for (const row of rows) {
        const tr = document.createElement("tr");

        const username = row.username || row.user || "-";
        const bank = row.bank || row.bank_name || "";
        const accNo = row.rekening || "-";
        const accName = row.nama || "-";
        const nominalRaw = row.nominal || row.amount || row.total || 0;

        const bankCombined = [bank, accNo, accName].filter(Boolean).join(" | ");

        tr.innerHTML = `
          <td>${escapeHtml(username)}</td>
          <td>${escapeHtml(bankCombined)}</td>
          <td>${formatCurrency(nominalRaw)}</td>
          <td>
            <button class="btn-small" data-copy="${escapeAttr(
              `${username} | ${bankCombined} | ${nominalRaw}`
            )}">Copy</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      tbody.innerHTML = '<tr><td colspan="4" class="error-row">Error loading data.</td></tr>';
      errorEl.textContent = "Failed to load data.";
    }
  }

  // Event delegation for copy buttons
  if (tbody) {
    tbody.addEventListener("click", async (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.matches("button[data-copy]")) {
        const text = target.getAttribute("data-copy") || "";
        try {
          await navigator.clipboard.writeText(text);
          target.textContent = "Copied";
          setTimeout(() => {
            target.textContent = "Copy";
          }, 1200);
        } catch (err) {
          console.error("Clipboard failed", err);
        }
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadData();
    });
  }

  loadData();
});

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// For attribute context
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
