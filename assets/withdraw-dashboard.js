document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("withdraw-table-body");
  const refreshBtn = document.getElementById("refresh-btn");

  // Auth simple check
  if (localStorage.getItem("wd-auth") !== "ok") {
    window.location.href = "/login.html";
    return;
  }

  async function loadWithdraws() {
    tbody.innerHTML = `
      <tr><td colspan="6" class="loading-row">Loading data...</td></tr>
    `;

    try {
      const res = await fetch("/api/transaction?type=withdraw");
      if (!res.ok) throw new Error("HTTP " + res.status);

      const json = await res.json();
      const rows = Array.isArray(json) ? json : json.data;

      if (!rows || rows.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="6" class="empty-row">No data found.</td></tr>
        `;
        return;
      }

      tbody.innerHTML = "";

      for (const row of rows) {
        const tr = document.createElement("tr");

        const id = row.id || "-";
        const username = row.username || "-";
        const bank = row.bank || "-";
        const rek = row.rekening || "-";
        const nama = row.nama || "-";
        const nominal = formatCurrency(row.nominal || 0);
        const shift = row.shift || "-";
        const operator = row.operator || "-";

        const bankCombined = `${bank} | ${rek} | ${nama}`;

        tr.innerHTML = `
          <td>${escapeHtml(id)}</td>
          <td>${escapeHtml(username)}</td>
          <td>${escapeHtml(bankCombined)}</td>
          <td>${nominal}</td>
          <td>${escapeHtml(shift)}</td>
          <td>${escapeHtml(operator)}</td>
        `;

        tbody.appendChild(tr);
      }

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `
        <tr><td colspan="6" class="error-row">Error loading data.</td></tr>
      `;
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", loadWithdraws);

  loadWithdraws();
});

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
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
