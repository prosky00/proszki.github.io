window.init_szamlalok = function () {
  function renderCrabStats() {
    const state = window.Store.getState();
    const logs = state.rawLogs || [];
    const playerName = state.playerName || window.StorageHelper.getName() || "";

    let totalWeight = 0;
    let totalMoney = 0;
    let totalTraps = 0;

    const escapedName = playerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const sellRegex = /\[SeeMTA - Siker\]:\s*Sikeresen eladtál\s+([\d\s.]+)\s+kg rákot\s+([\d\s.]+)\s+\$-ért!/i;

    const trapRegex = new RegExp(
      `\\*\\*\\*\\s*${escapedName}\\s+becsalizott egy ketrecet\\.`,
      "i"
    );

    logs.forEach(text => {
      const lines = String(text).split(/\r?\n/);

      lines.forEach(line => {
        const sellMatch = line.match(sellRegex);
        if (sellMatch) {
          totalWeight += Number(String(sellMatch[1]).replace(/[^\d]/g, "")) || 0;
          totalMoney += Number(String(sellMatch[2]).replace(/[^\d]/g, "")) || 0;
        }

        if (trapRegex.test(line)) {
          totalTraps += 1;
        }
      });
    });

    const weightEl = document.getElementById("crabWeight");
    const moneyEl = document.getElementById("crabMoney");
    const trapsEl = document.getElementById("crabTraps");

    if (weightEl) weightEl.textContent = totalWeight.toLocaleString("hu-HU");
    if (moneyEl) moneyEl.textContent = totalMoney.toLocaleString("hu-HU");
    if (trapsEl) trapsEl.textContent = totalTraps.toLocaleString("hu-HU");
  }

  window.addEventListener("app-state-changed", renderCrabStats);
  renderCrabStats();
};