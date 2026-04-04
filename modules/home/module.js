window.init_home=function(){
  const logInput=document.getElementById("homeLogInput");

  function renderHomeStats(){
    const state=window.Store.getState();
    const stats=state.moduleStats?.dashboard||{};
    const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
    set("homeTotalPoints",stats.totalPoints??0);
    set("homeTicketCount",stats.totalTickets??0);
    set("homeTraffiCount",stats.totalTraffi??0);
    set("homeLefCount",stats.totalLefoglalas??0);
    set("homeKivCount",stats.totalKivaltas??0);
    set("homeKivaltasTicketCount",stats.kivaltasTicketCount??0);
    set("homeTraffiSum",`${Number(stats.traffiSum??0).toLocaleString("hu-HU")}$`);
  }

  async function handleLogFiles(files){
    const state=window.Store.getState();
    const playerName=state.playerName||window.StorageHelper.getName();
    if(!playerName){alert("Előbb add meg a neved felül.");return;}
    const texts=await Promise.all([...files].map(f=>f.text()));
    const merged=texts.join("\n");
    const parsed=window.LogParser.parse(merged,playerName);
    const moduleStats=window.StatsBuilder.build(parsed);

    window.Store.update(state=>{
      state.rawLogs=texts;
      state.parsed=parsed;
      state.moduleStats=moduleStats;
      return state;
    });
  }

  if(logInput){
    logInput.addEventListener("change",e=>handleLogFiles(e.target.files));
  }
  window.addEventListener("app-state-changed",renderHomeStats);
  renderHomeStats();
};