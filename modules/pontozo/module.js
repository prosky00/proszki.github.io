window.init_pontozo=function(){
  const isKivaltasTicket=reason=>String(reason||"").toLowerCase().includes("kiváltás");

  function renderList(containerId,items,formatFn){
    const box=document.getElementById(containerId);
    if(!box) return;
    if(!items||!items.length){box.innerHTML='<div class="list-item">Nincs adat.</div>'; return;}
    box.innerHTML=items.map(item=>`<div class="list-item">${formatFn(item)}</div>`).join("");
  }

  function renderHistory(){
    const box=document.getElementById("historyList");
    if(!box) return;
    const history=window.Store.getState().history||[];
    if(!history.length){box.innerHTML='<div class="muted">Még nincs mentett hét.</div>'; return;}
    box.innerHTML=[...history].reverse().map(h=>`
      <details>
        <summary>${h.label} — ${h.points.total} pont</summary>
        <div class="small muted" style="margin-top:8px;">
          Mentve: ${h.savedAt}<br>
          Traffipax pont: ${h.points.traffi}<br>
          Normál csekk pont: ${h.points.ticket}<br>
          Lefoglalás pont: ${h.points.lefoglalas}<br>
          Kiváltás pont: ${h.points.kivaltas}<br>
          Traffipax összeg: ${Number(h.traffiSum||0).toLocaleString("hu-HU")}$<br>
          Darabszámok: csekk ${h.counts.ticket}, traffi ${h.counts.traffi}, lefoglalás ${h.counts.lefoglalas}, kiváltás ${h.counts.kivaltas}
        </div>
      </details>
    `).join("");
  }

  function saveWeek(){
    const state=window.Store.getState();
    const parsed=state.parsed||{tickets:[],traffi:[],lefoglalas:[],kivaltas:[]};
    const stats=state.moduleStats?.pontozo||{};
    const now=new Date();
    const monday=new Date(now); monday.setDate(now.getDate()-((now.getDay()+6)%7)); monday.setHours(0,0,0,0);
    const sunday=new Date(monday); sunday.setDate(monday.getDate()+6);

    const fmt=d=>`${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,"0")}. ${String(d.getDate()).padStart(2,"0")}.`;
    const label=`Heti teljesítmény (${fmt(monday)} - ${fmt(sunday)})`;

    const normalTickets=(parsed.tickets||[]).filter(t=>!isKivaltasTicket(t.reason));

    const entry={
      id:`${monday.getFullYear()}-W${Math.ceil((((monday - new Date(monday.getFullYear(),0,1))/86400000)+1)/7)}`,
      label,
      savedAt:new Date().toLocaleString("hu-HU"),
      points:{
        total:stats.totalPoints||0,
        traffi:stats.traffiPoints||0,
        ticket:stats.ticketPoints||0,
        lefoglalas:stats.lefoglalasPoints||0,
        kivaltas:stats.kivaltasPoints||0
      },
      counts:{
        ticket:normalTickets.length,
        traffi:(parsed.traffi||[]).length,
        lefoglalas:(parsed.lefoglalas||[]).length,
        kivaltas:(parsed.kivaltas||[]).length
      },
      traffiSum:stats.traffiSum||0
    };

    window.Store.update(state=>{
      state.history=Array.isArray(state.history)?state.history:[];
      state.history.push(entry);
      return state;
    });
    renderHistory();
    alert("A hét el lett mentve.");
  }

  function resetCurrent(){
    if(!confirm("Biztosan törlöd az aktuális hét betöltött adatait?")) return;
    window.Store.update(state=>{
      state.rawLogs=[];
      state.parsed={tickets:[],traffi:[],lefoglalas:[],kivaltas:[]};
      state.moduleStats=window.StatsBuilder.build(state.parsed);
      return state;
    });
  }

  function clearHistory(){
    if(!confirm("Biztosan törlöd az összes mentett hetet?")) return;
    window.Store.update(state=>{state.history=[]; return state;});
    renderHistory();
  }

  function renderPontozo(){
    const state=window.Store.getState();
    const parsed=state.parsed||{};
    const stats=state.moduleStats?.pontozo||{};
    const normalTickets=(parsed.tickets||[]).filter(t=>!isKivaltasTicket(t.reason));
    const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};

    set("pontozoTotalPoints",stats.totalPoints??0);
    set("pontozoTicketPoints",stats.ticketPoints??0);
    set("pontozoTraffiPoints",stats.traffiPoints??0);
    set("pontozoLefPoints",stats.lefoglalasPoints??0);
    set("pontozoKivPoints",stats.kivaltasPoints??0);
    set("pontozoTraffiSum",`${Number(stats.traffiSum??0).toLocaleString("hu-HU")}$`);
    set("pontozoTicketCount",normalTickets.length);
    set("pontozoTraffiCount",(parsed.traffi||[]).length);

    set("countTicket",`${normalTickets.length} db`);
    set("countTraffi",`${parsed.traffi?.length??0} db`);
    set("countLef",`${parsed.lefoglalas?.length??0} db`);
    set("countKiv",`${parsed.kivaltas?.length??0} db`);

    renderList("listTicket",normalTickets,e=>`${e.ts} • ${e.target} • ${Number(e.fine||0).toLocaleString("hu-HU")}$ • Indok: ${e.reason} <span class="ok">+2 pont</span>`);
    renderList("listTraffi",parsed.traffi||[],e=>`${e.ts} • ${e.plate} • ${Number(e.fine||0).toLocaleString("hu-HU")}$`);
    renderList("listLef",parsed.lefoglalas||[],e=>`${e.ts} • Rendszám: ${e.plate} • ID: ${e.id}`);
    renderList("listKiv",parsed.kivaltas||[],e=>`${e.ts} • Rendszám: ${e.plate} • ID: ${e.id}`);

    renderHistory();
  }

  const btnSave=document.getElementById("btnSaveWeek");
  const btnReset=document.getElementById("btnResetCurrent");
  const btnClear=document.getElementById("btnClearHistory");
  if(btnSave) btnSave.onclick=saveWeek;
  if(btnReset) btnReset.onclick=resetCurrent;
  if(btnClear) btnClear.onclick=clearHistory;

  window.addEventListener("app-state-changed",renderPontozo);
  renderPontozo();
};