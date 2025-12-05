// ==UserScript==
// @name         WL Approve Sync → WD Panel
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Kirim data approve WL ke dashboard panel
// @match        https://control.wl1cg.com/*CashOutBatchV2.aspx*
// @match        https://control.wl1cg.com/*Depo.aspx*
// @grant        none
// ==/UserScript==

(function() {
  "use strict";

  const PANEL_API_BASE = "https://wd-panel-combined.vercel.app";

  console.log("[TM] WL Sync Script loaded");

  // simple state: operator name (bisa dikembangin jadi UI prompt)
  let operatorName = localStorage.getItem("wl_operator_name") || "";

  if (!operatorName) {
    operatorName = window.prompt("Masukkan nama operator untuk log transaksi:", "");
    if (operatorName) {
      localStorage.setItem("wl_operator_name", operatorName);
    }
  }

  if (!operatorName) {
    console.warn("[TM] Operator name tidak diisi. Script tidak akan kirim data.");
    return;
  }

  document.addEventListener("click", async (e) => {
    const target = e.target;

    if (!(target instanceof HTMLElement)) return;

    // ini contoh: adjust sesuai teks/kelas tombol APPROVE di WL lu
    if (target.innerText.trim().toLowerCase() === "approve") {
      const row = target.closest("tr");
      if (!row) return;

      // deteksi jenis halaman: withdraw vs deposit
      const isWithdrawPage = window.location.href.includes("CashOutBatchV2");
      const isDepositPage = window.location.href.includes("Depo.aspx");

      let parsed;
      if (isWithdrawPage) {
        parsed = parseRowForWithdraw(row);
      } else if (isDepositPage) {
        parsed = parseRowForDeposit(row);
      } else {
        return;
      }

      if (!parsed) {
        console.warn("[TM] Gagal parse row.");
        return;
      }

      const payload = {
        type: isWithdrawPage ? "withdraw" : "deposit",
        username: parsed.username,
        bank: parsed.bank,
        account_number: parsed.account_number,
        account_name: parsed.account_name,
        nominal: parsed.nominal,
        operator: operatorName,
        approved_at: new Date().toISOString()
      };

      console.log("[TM] Sending payload:", payload);

      try {
        await fetch(`${PANEL_API_BASE}/api/tx-insert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          // kalau nanti pakai cookie session panel:
          // credentials: "include",
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("[TM] Gagal kirim ke panel:", err);
      }
    }
  });

  // ========= PARSING ==============

  function parseRowForWithdraw(row) {
    // TODO: sesuaikan selector dengan HTML WL withdraw
    // contoh kasar:
    const tds = row.querySelectorAll("td");
    if (tds.length < 4) return null;

    // misal:
    // td[0]: username + info lain
    // td[1]: bank + rek + nama (dipisah <br>)
    // td[2]: amount, dll

    const usernameText = tds[0].innerText.trim();
    const bankBlock = tds[1].innerText.split("\n").map(s => s.trim()).filter(Boolean);
    const amountText = tds[2].innerText.replace(/[^0-9]/g, "");

    return {
      username: usernameText.split("\n")[0] || "",
      bank: bankBlock[0] || "",
      account_number: bankBlock[1] || "",
      account_name: bankBlock[2] || "",
      nominal: Number(amountText || "0")
    };
  }

  function parseRowForDeposit(row) {
    // hampir sama, tapi sesuaikan dengan struktur Depo.aspx
    const tds = row.querySelectorAll("td");
    if (tds.length < 4) return null;

    const usernameText = tds[0].innerText.trim();
    const bankBlock = tds[1].innerText.split("\n").map(s => s.trim()).filter(Boolean);
    const amountText = tds[2].innerText.replace(/[^0-9]/g, "");

    return {
      username: usernameText.split("\n")[0] || "",
      bank: bankBlock[0] || "",
      account_number: bankBlock[1] || "",
      account_name: bankBlock[2] || "",
      nominal: Number(amountText || "0")
    };
  }

})();
