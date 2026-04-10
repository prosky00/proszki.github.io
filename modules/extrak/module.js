window.init_extrak = function () {
  function parseDateTime(text) {
    const match = String(text).match(
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/
    );
    if (!match) return null;

    const [, y, mo, d, h, mi, s] = match;
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s)
    );
  }

  function minutesBetween(start, end) {
    const diffMs = end - start;
    return Math.max(0, Math.round(diffMs / 60000));
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = "✅";
      setTimeout(() => {
        btn.textContent = old;
      }, 1000);
    }).catch(() => {
      alert("A másolás nem sikerült.");
    });
  }

  function buildDutyPairs() {
    const state = window.Store.getState();
    const logs = state.rawLogs || [];

    const startRegex =
      /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\].*\[SeeMTA - Információ\]: Szolgálatba álltál!/i;

    const endRegex =
      /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\].*\[SeeMTA - Információ\]: Leadtad a szolgálatot\./i;

    const events = [];

    logs.forEach((text) => {
      const lines = String(text).split(/\r?\n/);

      lines.forEach((line) => {
        const startMatch = line.match(startRegex);
        if (startMatch) {
          const dt = parseDateTime(startMatch[1]);
          if (dt) {
            events.push({
              type: "start",
              ts: startMatch[1],
              fullLine: line.trim(), // 🔥 EZ A LÉNYEG
              date: dt,
            });
          }
          return;
        }

        const endMatch = line.match(endRegex);
        if (endMatch) {
          const dt = parseDateTime(endMatch[1]);
          if (dt) {
            events.push({
              type: "end",
              ts: endMatch[1],
              fullLine: line.trim(), // 🔥 EZ A LÉNYEG
              date: dt,
            });
          }
        }
      });
    });

    events.sort((a, b) => a.date - b.date);

    const pairs = [];
    let currentStart = null;

    for (const event of events) {
      if (event.type === "start") {
        currentStart = event;
        continue;
      }

      if (event.type === "end" && currentStart) {
        pairs.push({
          startTs: currentStart.ts,
          endTs: event.ts,
          startLine: currentStart.fullLine, // 🔥
          endLine: event.fullLine,           // 🔥
          minutes: minutesBetween(currentStart.date, event.date),
        });
        currentStart = null;
      }
    }

    return pairs;
  }

  function renderDutyList() {
    const list = document.getElementById("dutyList");
    const count = document.getElementById("dutyCount");
    if (!list) return;

    const pairs = buildDutyPairs();

    if (count) {
      count.textContent = `${pairs.length} db`;
    }

    if (!pairs.length) {
      list.innerHTML = `<div class="list-item">Nincs adat.</div>`;
      return;
    }

    list.innerHTML = pairs.map((pair, index) => `
      <div class="list-item">

        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div><b>Kezdés:</b> ${pair.startTs}</div>
          <button class="link-btn" data-copy-start="${index}" title="Teljes log másolása">📋</button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;">
          <div><b>Leadás:</b> ${pair.endTs}</div>
          <button class="link-btn" data-copy-end="${index}" title="Teljes log másolása">📋</button>
        </div>

        <div style="margin-top:8px;">
          <b>Eltelt idő:</b> ${pair.minutes} perc
        </div>

      </div>
    `).join("");

    document.querySelectorAll("[data-copy-start]").forEach((btn) => {
      btn.onclick = () => {
        const pair = pairs[btn.dataset.copyStart];
        if (!pair) return;
        copyText(pair.startLine, btn); // 🔥 TELJES SOR
      };
    });

    document.querySelectorAll("[data-copy-end]").forEach((btn) => {
      btn.onclick = () => {
        const pair = pairs[btn.dataset.copyEnd];
        if (!pair) return;
        copyText(pair.endLine, btn); // 🔥 TELJES SOR
      };
    });
  }

  window.addEventListener("app-state-changed", renderDutyList);
  renderDutyList();
};