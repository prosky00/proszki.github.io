window.Router={
  async loadView(viewName){
    const content=document.getElementById("content");
    try{
      const response=await fetch(`modules/${viewName}/view.html`);
      if(!response.ok) throw new Error(`Nem tölthető be: ${viewName}`);
      const html=await response.text();
      content.innerHTML=html;
      this.updateNameEverywhere();
      await this.tryLoadModuleScript(`modules/${viewName}/module.js`,viewName);
    }catch(error){
      content.innerHTML=`<div class="module-card"><h2>Hiba</h2><p>Nem sikerült betölteni a modult: <b>${viewName}</b></p><p class="muted">${error.message}</p></div>`;
      console.error(error);
    }
  },
  async tryLoadModuleScript(path,viewName){
    try{
      const old=document.getElementById("dynamic-module-script");
      if(old) old.remove();
      const exists=await fetch(path,{method:"GET"});
      if(!exists.ok) return;
      const script=document.createElement("script");
      script.src=`${path}?v=${Date.now()}`;
      script.id="dynamic-module-script";
      script.onload=()=>{const initName=`init_${viewName.replace(/-/g,"_")}`; if(typeof window[initName]==="function") window[initName]()};
      document.body.appendChild(script);
    }catch(err){console.warn("Module script load skipped:",path,err)}
  },
  updateNameEverywhere(){
    const currentName=window.StorageHelper.getName();
    document.querySelectorAll("[data-player-name]").forEach(el=>{el.textContent=currentName||"Nincs megadva"});
  }
};