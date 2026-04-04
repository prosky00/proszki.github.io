window.init_lefoglalo = function () {
  const isKivaltasTicket = (reason) =>
    String(reason || "").toLowerCase().includes("kiváltás");

  let editingVehicleId = null;

  function getManualData(id) {
    const state = window.Store.getState();
    return state.manualData?.lefoglalo?.[id] || { reason: "", imageUrl: "" };
  }

  function saveManualData(id, data) {
    window.Store.update((state) => {
      state.manualData = state.manualData || {};
      state.manualData.lefoglalo = state.manualData.lefoglalo || {};
      state.manualData.lefoglalo[id] = {
        ...state.manualData.lefoglalo[id],
        ...data,
      };
      return state;
    });
  }

  function renderList(containerId, items, formatFn) {
    const box = document.getElementById(containerId);
    if (!box) return;

    if (!items || !items.length) {
      box.innerHTML = `<div class="list-item">Nincs adat.</div>`;
      return;
    }

    box.innerHTML = items
      .map((item) => `<div class="list-item">${formatFn(item)}</div>`)
      .join("");
  }

  function openImageModal(url) {
    const modal = document.getElementById("imageModal");
    const body = document.getElementById("imageModalBody");
    if (!modal || !body) return;

    if (!url) {
      body.innerHTML = `<div>Nincs megadott link.</div>`;
    } else if (/\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(url)) {
      body.innerHTML = `<img src="${url}" alt="preview" />`;
    } else {
      body.innerHTML = `<div><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></div>`;
    }

    modal.classList.add("show");
  }

  function closeImageModal() {
    const modal = document.getElementById("imageModal");
    if (modal) modal.classList.remove("show");
  }

  function openEditModal(vehicle) {
    editingVehicleId = vehicle.id;

    const modal = document.getElementById("editModal");
    const reason = document.getElementById("modalReason");
    const imageUrl = document.getElementById("modalImageUrl");
    const idInput = document.getElementById("modalVehicleId");
    const plateInput = document.getElementById("modalVehiclePlate");

    const manual = getManualData(vehicle.id);

    if (idInput) idInput.value = vehicle.id || "";
    if (plateInput) plateInput.value = vehicle.plate || "";
    if (reason) reason.value = manual.reason || "";
    if (imageUrl) imageUrl.value = manual.imageUrl || "";

    if (modal) modal.classList.add("show");
  }

  function closeEditModal() {
    const modal = document.getElementById("editModal");
    if (modal) modal.classList.remove("show");
    editingVehicleId = null;
  }

  function bindModalButtons() {
    const save = document.getElementById("modalSaveBtn");
    const preview = document.getElementById("modalPreviewBtn");
    const cancel = document.getElementById("modalCancelBtn");
    const closeImage = document.getElementById("imageModalCloseBtn");

    if (save) {
      save.onclick = () => {
        if (!editingVehicleId) return;

        const reason = document.getElementById("modalReason")?.value?.trim() || "";
        const imageUrl =
          document.getElementById("modalImageUrl")?.value?.trim() || "";

        saveManualData(editingVehicleId, { reason, imageUrl });
        closeEditModal();
      };
    }

    if (preview) {
      preview.onclick = () => {
        const imageUrl =
          document.getElementById("modalImageUrl")?.value?.trim() || "";
        openImageModal(imageUrl);
      };
    }

    if (cancel) cancel.onclick = closeEditModal;
    if (closeImage) closeImage.onclick = closeImageModal;
  }

  function buildReleasedList(parsed) {
    const kivaltasTickets = (parsed.tickets || []).filter((t) =>
      isKivaltasTicket(t.reason)
    );

    return (parsed.kivaltas || []).map((k) => {
      const related = kivaltasTickets.find(
        (t) => String(t.vehicleId || "") === String(k.id || "")
      );

      return {
        ...k,
        ticketReason: related?.reason || "-",
        ticketFine: related?.fine || 0,
        target: related?.target || "-",
      };
    });
  }

  function getKivaltasReasonValue() {
    const select = document.getElementById("kivaltasReasonSelect");
    const custom = document.getElementById("kivaltasCustomReason");

    if (!select) return "Indok";

    if (select.value === "Egyéb") {
      return (custom?.value || "Indok").trim() || "Indok";
    }

    return select.value.trim();
  }

  function updateKivaltasOutput() {
    const output = document.getElementById("kivaltasOutput");
    const vehicleId = document.getElementById("kivaltasVehicleId");

    if (!output || !vehicleId) return;

    const reason = getKivaltasReasonValue();
    const id = vehicleId.value.trim() || "JárműID";

    output.textContent = `${reason} + kiváltás [${id}]`;
  }

  function wireKivaltasHelper() {
    const select = document.getElementById("kivaltasReasonSelect");
    const customWrap = document.getElementById("kivaltasCustomReasonWrap");
    const custom = document.getElementById("kivaltasCustomReason");
    const vehicleId = document.getElementById("kivaltasVehicleId");
    const copyBtn = document.getElementById("copyKivaltasOutput");
    const output = document.getElementById("kivaltasOutput");

    if (select) {
      select.onchange = () => {
        const isOther = select.value === "Egyéb";
        if (customWrap) customWrap.hidden = !isOther;
        if (!isOther && custom) custom.value = "";
        updateKivaltasOutput();
      };
    }

    if (custom) {
      custom.oninput = updateKivaltasOutput;
    }

    if (vehicleId) {
      vehicleId.oninput = updateKivaltasOutput;
    }

    if (copyBtn && output) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(output.textContent);
          copyBtn.textContent = "Kimásolva!";
          setTimeout(() => {
            copyBtn.textContent = "Másolás";
          }, 1200);
        } catch {
          alert("A másolás nem sikerült.");
        }
      };
    }

    updateKivaltasOutput();
  }

  function renderLefoglalo() {
    const state = window.Store.getState();
    const parsed = state.parsed || {};
    const stats = state.moduleStats?.lefoglalo || {};

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const seized = (parsed.lefoglalas || []).map((e) => ({
      ...e,
      manual: getManualData(e.id),
    }));

    const released = buildReleasedList(parsed);

    set("lefoglaloLefCount", stats.lefoglalasCount ?? 0);
    set("lefoglaloKivCount", stats.kivaltasCount ?? 0);
    set("lefoglaloTicketCount", stats.kivaltasTicketCount ?? 0);
    set("countSeized", `${seized.length} db`);
    set("countReleased", `${released.length} db`);

    renderList("listSeized", seized, (e) => {
      const reason = e.manual?.reason
        ? `<div class="small muted">Indok: ${e.manual.reason}</div>`
        : `<div class="small muted">Indok: -</div>`;

      const hasImage = !!e.manual?.imageUrl;

      return `
        <div><b>${e.ts}</b> • Rendszám: ${e.plate} • ID: ${e.id}</div>
        ${reason}
        <div class="row-actions">
          ${
            hasImage
              ? `<button class="link-btn" type="button" data-preview="${e.id}" title="Kép megnyitása">🔍</button>`
              : ""
          }
          <button class="btn ghost small-btn" type="button" data-edit="${e.id}">Szerkesztés</button>
        </div>
      `;
    });

    renderList("listReleased", released, (e) => `
      <div><b>${e.ts}</b> • ID: ${e.id} • Rendszám: ${e.plate}</div>
      <div class="small muted">Indok: ${e.ticketReason}</div>
      <div class="small muted">Csekk: ${Number(e.ticketFine || 0).toLocaleString("hu-HU")}$ • Játékos: ${e.target}</div>
    `);

    document.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.edit;
        const vehicle = seized.find((x) => String(x.id) === String(id));
        if (vehicle) openEditModal(vehicle);
      };
    });

    document.querySelectorAll("[data-preview]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.preview;
        const manual = getManualData(id);
        openImageModal(manual.imageUrl || "");
      };
    });

    bindModalButtons();
  }

  wireKivaltasHelper();
  bindModalButtons();

  window.addEventListener("app-state-changed", renderLefoglalo);
  renderLefoglalo();
};