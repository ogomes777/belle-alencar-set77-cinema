/** Pure motion helpers for the Belle globe. Wheel/pinch zoom never loads external map tiles. */
export const MIN_GLOBE_ZOOM=1;
export const MAX_GLOBE_ZOOM=3.6;
export function clampGlobeZoom(value:number):number{
  if(!Number.isFinite(value))return MIN_GLOBE_ZOOM;
  return Math.min(MAX_GLOBE_ZOOM,Math.max(MIN_GLOBE_ZOOM,value));
}
export function wheelGlobeZoom(value:number,deltaY:number):number{
  if(!Number.isFinite(deltaY))return clampGlobeZoom(value);
  return clampGlobeZoom(value*Math.exp(-Math.max(-250,Math.min(250,deltaY))*.0017));
}
export function pinchGlobeZoom(value:number,nextDistance:number,previousDistance:number):number{
  if(!Number.isFinite(nextDistance)||!Number.isFinite(previousDistance)||previousDistance<=0)return clampGlobeZoom(value);
  return clampGlobeZoom(value*(nextDistance/previousDistance));
}
export function easeGlobeZoom(current:number,target:number,deltaMs:number):number{
  const desired=clampGlobeZoom(target);
  const t=1-Math.exp(-Math.max(0,Math.min(40,deltaMs))/130);
  const next=clampGlobeZoom(current+(desired-current)*t);
  return Math.abs(next-desired)<.001?desired:next;
}
