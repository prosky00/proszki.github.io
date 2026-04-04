window.init_home = function () {
  const logInput = document.getElementById("homeLogInput");
  let chartInstance = null;
  let currentFilter = "ticket";

  const isKivaltasTicket = (reason) =>
    String(reason || "").toLowerCase().includes("kiváltás");

  function getDetailItems() {
    const state = window.Store.getState();
    const parsed = state.parsed || {};

    const normalTickets = (parsed.tickets || []).filter(
      (t) => !isKivaltasTicket(t.reason)
    );

    if (currentFilter === "ticket") {
      return normalTickets.map(
        (e) =>
          `${e.ts} • ${e.target} • ${Number(e.fine || 0).toLocaleString("hu-HU")}$ • Indok: ${e.reason}`
      );
    }

    if (currentFilter === "traffi") {
      return (parsed.traffi || []).map(
        (e) =>
          `${e.ts} • ${e.plate} • ${Number(e.fine || 0).toLocaleString("hu-HU")}$`
      );
    }

    if (currentFilter === "kivaltas") {
      return (parsed.kivaltas || []).map(
        (e) =>
          `${e.ts} • Rendszám: ${e.plate} • ID: ${e.id}`
      );
    }

    if (currentFilter === "lefoglalas") {
      return (parsed.lefoglalas || []).map(
        (e) =>
          `${e.ts} • Rendszám: ${e.plate} • ID: ${e.id}`
      );
    }

    return [];
  }

  function renderDetailList() {
    const list = document.getElementById("homeDetailList");
    if (!list) return;

    const items = getDetailItems();

    if (!items.length) {
      list.innerHTML = `<div class="list-item">Nincs adat.</div>`;
      return;
    }

    list.innerHTML = items
      .map((item) => `<div class="list-item">${item}</div>`)
      .join("");
  }

  function renderChart(stats) {
    const canvas = document.getElementById("homePointsChart");
    const empty = document.getElementById("homeChartEmpty");
    if (!canvas) return;

    const ticketPoints = Number(stats.ticketPoints || 0);
    const traffiPoints = Number(stats.traffiPoints || 0);
    const lefPoints = Number(stats.lefoglalasPoints || 0);
    const kivPoints = Number(stats.kivaltasPoints || 0);

    const total = ticketPoints + traffiPoints + lefPoints + kivPoints;

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    if (total <= 0) {
      canvas.style.display = "none";
      if (empty) empty.style.display = "block";
      return;
    }

    canvas.style.display = "block";
    if (empty) empty.style.display = "none";

    chartInstance = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Normál csekk", "Traffipax", "Lefoglalás", "Kiváltás"],
        datasets: [
          {
            data: [ticketPoints, traffiPoints, lefPoints, kivPoints],
            backgroundColor: ["#2563eb", "#7c3aed", "#22c55e", "#f59e0b"],
            borderColor: "#111827",
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#e5e7eb",
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.raw} pont`;
              }
            }
          }
        }
      }
    });
  }

  function renderHomeStats() {
    const state = window.Store.getState();
    const parsed = state.parsed || {};
    const dashboard = state.moduleStats?.dashboard || {};
    const pontozo = state.moduleStats?.pontozo || {};

    const normalTickets = (parsed.tickets || []).filter(
      (t) => !isKivaltasTicket(t.reason)
    );
    const kivaltasTickets = (parsed.tickets || []).filter((t) =>
      isKivaltasTicket(t.reason)
    );

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("homeTotalPoints", dashboard.totalPoints ?? 0);
    setText("homeTicketCount", normalTickets.length);
    setText("homeTraffiCount", parsed.traffi?.length ?? 0);
    setText("homeLefCount", parsed.lefoglalas?.length ?? 0);
    setText("homeKivCount", parsed.kivaltas?.length ?? 0);
    setText("homeTicketPoints", pontozo.ticketPoints ?? 0);
    setText("homeTraffiPoints", pontozo.traffiPoints ?? 0);
    setText("homeLefPoints", pontozo.lefoglalasPoints ?? 0);
    setText("homeKivPoints", pontozo.kivaltasPoints ?? 0);
    setText(
      "homeTraffiSum",
      Number(dashboard.traffiSum ?? 0).toLocaleString("hu-HU")
    );
    setText("homeKivaltasTicketCount", kivaltasTickets.length);

    renderChart(pontozo);
    renderDetailList();
  }

  async function handleLogFiles(files) {
    const state = window.Store.getState();
    const playerName = state.playerName || window.StorageHelper.getName();

    if (!playerName) {
      alert("Előbb add meg a neved felül.");
      return;
    }

    const texts = await Promise.all([...files].map((f) => f.text()));
    const merged = texts.join("\\n");

    const parsed = window.LogParser.parse(merged, playerName);
    const moduleStats = window.StatsBuilder.build(parsed);

    window.Store.update((state) => {
      state.rawLogs = texts;
      state.parsed = parsed;
      state.moduleStats = moduleStats;
      return state;
    });
  }

  function wireFilters() {
    const buttons = document.querySelectorAll("[data-home-filter]");
    buttons.forEach((btn) => {
      btn.onclick = () => {
        buttons.forEach((b) => b.classList.remove("active-home-filter"));
        btn.classList.add("active-home-filter");
        currentFilter = btn.dataset.homeFilter;
        renderDetailList();
      };
    });
  }

  if (logInput) {
    logInput.addEventListener("change", (e) => {
      handleLogFiles(e.target.files);
    });
  }

  wireFilters();
  window.addEventListener("app-state-changed", renderHomeStats);
  renderHomeStats();
};