document.addEventListener("DOMContentLoaded",async()=>{
  const nameInput=document.getElementById("playerName");
  const menuButtons=document.querySelectorAll(".menu-btn");
  window.Store.load();

  const currentName=window.Store.getState().playerName||window.StorageHelper.getName();
  nameInput.value=currentName;

  if(currentName){
    window.StorageHelper.setName(currentName);
    window.Store.update(state=>{state.playerName=currentName;return state;});
  }

  nameInput.addEventListener("input",()=>{
    const newName=nameInput.value.trim();
    window.StorageHelper.setName(newName);
    window.Store.update(state=>{state.playerName=newName;return state;});
    window.Router.updateNameEverywhere();
  });

  menuButtons.forEach(btn=>{
    btn.addEventListener("click",async()=>{
      menuButtons.forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      await window.Router.loadView(btn.dataset.view);
    });
  });

  await window.Router.loadView("home");
});