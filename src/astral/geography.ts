export const CITIES = [
  {id:'araxa',name:'Araxá',lat:-19.593,lon:-46.941,state:'Minas Gerais',stateLat:-18.5,stateLon:-44.6},
  {id:'frutal',name:'Frutal',lat:-20.025,lon:-48.935,state:'Minas Gerais',stateLat:-18.5,stateLon:-44.6},
  {id:'catalao',name:'Catalão',lat:-18.165,lon:-47.946,state:'Goiás',stateLat:-15.8,stateLon:-49.6},
  {id:'mineiros',name:'Mineiros',lat:-17.565,lon:-52.554,state:'Goiás',stateLat:-15.8,stateLon:-49.6},
] as const;
export const spherePoint=(lat:number,lon:number)=>{
  const a=lat*Math.PI/180,b=lon*Math.PI/180;
  return {x:Math.cos(a)*Math.cos(b),y:-Math.sin(a),z:Math.cos(a)*Math.sin(b)};
};
export const smooth=(x:number)=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
/** Deliberate country → state → city stops, with continuous camera position. */
export function journey(city:typeof CITIES[number],elapsed:number){
  const state=smooth((elapsed-600)/1500), local=smooth((elapsed-2400)/1800);
  return {lat:-15+ (city.stateLat+15)*state+(city.lat-city.stateLat)*local,
    lon:-51+(city.stateLon+51)*state+(city.lon-city.stateLon)*local,
    // Return to the living globe after the geographic close-up.
    zoom:1+(4*state+25*local)*(1-smooth((elapsed-4200)/1000)),
    label:elapsed<2100?'Brasil':elapsed<4200?city.state:city.name};
}
