window.Store={
  state:{
    playerName:"",
    rawLogs:[],
    parsed:{tickets:[],traffi:[],lefoglalas:[],kivaltas:[]},
    manualData:{lefoglalo:{}},
    moduleStats:{dashboard:{},pontozo:{},lefoglalo:{}},
    history:[]
  },
  load(){
    try{
      const saved=localStorage.getItem("multiToolState");
      if(saved){
        const parsed=JSON.parse(saved);
        this.state={...this.state,...parsed,manualData:{lefoglalo:{},...(parsed.manualData||{})},moduleStats:{dashboard:{},pontozo:{},lefoglalo:{},...(parsed.moduleStats||{})},parsed:{tickets:[],traffi:[],lefoglalas:[],kivaltas:[],...(parsed.parsed||{})},history:Array.isArray(parsed.history)?parsed.history:[]};
      }
    }catch(err){console.error("Store load error:",err)}
  },
  save(){localStorage.setItem("multiToolState",JSON.stringify(this.state))},
  getState(){return this.state},
  setState(nextState){
    this.state=nextState;
    this.save();
    window.dispatchEvent(new CustomEvent("app-state-changed",{detail:this.state}));
  },
  update(updater){
    const next=typeof updater==="function"?updater(structuredClone?structuredClone(this.state):JSON.parse(JSON.stringify(this.state))):{...this.state,...updater};
    this.setState(next);
  }
};