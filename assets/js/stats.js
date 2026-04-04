window.StatsBuilder={
  isKivaltasTicket(reason){return String(reason||"").toLowerCase().includes("kiváltás")},
  build(parsed){
    const normalTickets=(parsed.tickets||[]).filter(t=>!this.isKivaltasTicket(t.reason));
    const kivaltasTickets=(parsed.tickets||[]).filter(t=>this.isKivaltasTicket(t.reason));
    const traffiSum=(parsed.traffi||[]).reduce((sum,item)=>sum+(item.fine||0),0);
    const traffiPoints=Math.floor(traffiSum/20000);
    const ticketPoints=normalTickets.length*2;
    const lefoglalasPoints=(parsed.lefoglalas||[]).length*2;
    const kivaltasPoints=(parsed.kivaltas||[]).length*2;
    const totalPoints=ticketPoints+traffiPoints+lefoglalasPoints+kivaltasPoints;

    return {
      dashboard:{
        totalPoints,totalTickets:normalTickets.length,totalTraffi:(parsed.traffi||[]).length,
        totalLefoglalas:(parsed.lefoglalas||[]).length,totalKivaltas:(parsed.kivaltas||[]).length,
        traffiSum,kivaltasTicketCount:kivaltasTickets.length
      },
      pontozo:{
        totalPoints,ticketPoints,traffiPoints,lefoglalasPoints,kivaltasPoints,traffiSum,
        normalTicketCount:normalTickets.length
      },
      lefoglalo:{
        kivaltasTicketCount:kivaltasTickets.length,
        lefoglalasCount:(parsed.lefoglalas||[]).length,
        kivaltasCount:(parsed.kivaltas||[]).length
      }
    };
  }
};