window.LogParser={
  parse(text,playerName){
    const lines=text.split(/\r?\n/);
    const escapedName=(playerName||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const rxTraffiStart=new RegExp(`\\[SeeMTA - Traffipax\\]:\\s*${escapedName}\\b.*bemért.*?:\\s*([A-Z0-9-]+)`,"i");
    const rxTraffiFine=/\[SeeMTA - Traffipax\]:\s*Bírság:\s*([\d\s]+)\$/i;
    const rxTicket=new RegExp(`\\[SeeMTA - Ticket\\]:\\s*${escapedName} megbüntette\\s+(.+?)\\s+játékost\\.\\s*Bírság:\\s*([\\d\\s]+)\\$\\s*Indok:\\s*(.+)$`,"i");
    const rxLef=new RegExp(`\\[SeeMTA - Lefoglalás\\]:\\s*${escapedName} (lefoglalt|kiváltott) egy járművet\\.\\s*Rendszám:\\s*([A-Z0-9-]+)\\s*\\((\\d+)\\)`,"i");

    const parseMoneyInt=str=>{const cleaned=String(str||"").replace(/[^\d]/g,"");return cleaned?parseInt(cleaned,10):0};
    const extractTimestamp=line=>{const m=line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);return m?m[1]:""};
    const extractVehicleIdFromReason=reason=>{const m=String(reason||"").match(/\[(\d+)\]/);return m?m[1]:null};

    const result={tickets:[],traffi:[],lefoglalas:[],kivaltas:[]};

    for(let i=0;i<lines.length;i++){
      const line=lines[i];

      const tm=line.match(rxTicket);
      if(tm){
        const reason=(tm[3]||"").trim();
        result.tickets.push({
          ts:extractTimestamp(line),
          target:(tm[1]||"").trim(),
          fine:parseMoneyInt(tm[2]),
          reason,
          vehicleId:extractVehicleIdFromReason(reason)
        });
        continue;
      }

      const lm=line.match(rxLef);
      if(lm){
        const kind=(lm[1]||"").toLowerCase();
        const event={ts:extractTimestamp(line),plate:lm[2],id:lm[3]};
        if(kind.includes("lefoglalt")) result.lefoglalas.push(event);
        else result.kivaltas.push(event);
        continue;
      }

      const sm=line.match(rxTraffiStart);
      if(sm){
        const next=lines[i+1]||"";
        const fm=next.match(rxTraffiFine);
        if(fm){
          result.traffi.push({ts:extractTimestamp(line),plate:sm[1]||"",fine:parseMoneyInt(fm[1])});
          i++;
        }
      }
    }
    return result;
  }
};