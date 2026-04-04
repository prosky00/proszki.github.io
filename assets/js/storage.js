window.StorageHelper={
  getName(){return localStorage.getItem("playerName")||""},
  setName(value){localStorage.setItem("playerName",value)}
};