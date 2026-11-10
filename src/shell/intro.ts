/**
 * Belle intro: short, fullscreen and fail-open. No WebGL dependency.
 * The HTML head also includes an independent 1.5-second safety timeout.
 */
import { readSession, writeSession } from '../core/storage';

export function initIntro(): void {
  const root=document.documentElement;
  const intro=document.getElementById('intro');
  if(!intro){root.classList.remove('intro-playing');return;}
  if(root.classList.contains('intro-done')||root.classList.contains('intro-seen')||readSession('intro')||matchMedia('(prefers-reduced-motion: reduce)').matches){
    intro.remove();root.classList.remove('intro-playing','intro-opening','intro-skipped');root.classList.add('intro-done');return;
  }
  writeSession('intro','1');
  root.classList.add('intro-playing');
  let done=false,opening=0,removal=0;
  const events=['keydown','wheel','touchstart'] as const;
  function cleanup(){
    window.clearTimeout(opening);window.clearTimeout(removal);
    events.forEach(ev=>window.removeEventListener(ev,skip,true));
    intro.removeEventListener('pointerdown',skip);
    document.getElementById('introSkip')?.removeEventListener('click',skip);
    document.removeEventListener('visibilitychange',onVisibility);
    window.removeEventListener('pagehide',skip);
    intro.remove();
    root.classList.remove('intro-playing','intro-opening','intro-skipped');
    root.classList.add('intro-done');
  }
  function finish(fast=false){
    if(done)return;done=true;window.clearTimeout(opening);root.classList.remove('intro-playing');
    if(fast){cleanup();return;}
    root.classList.add('intro-opening');
    removal=window.setTimeout(cleanup,320);
  }
  function skip(){finish(true);}
  function onVisibility(){if(document.hidden)skip();}
  events.forEach(ev=>window.addEventListener(ev,skip,{capture:true,passive:true}));
  intro.addEventListener('pointerdown',skip);
  document.getElementById('introSkip')?.addEventListener('click',skip);
  document.addEventListener('visibilitychange',onVisibility);
  window.addEventListener('pagehide',skip);
  opening=window.setTimeout(()=>finish(false),620);
}
