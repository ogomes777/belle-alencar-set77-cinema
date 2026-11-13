/** Belle V41: official Instagram destinations supplied by the Belle project.
 * No scraping, redirects, external embeds, third-party scripts or profile data calls.
 * Native dialog provides Escape, keyboard trap, scroll containment and screen-reader semantics.
 */
export function initBelleInstagramDirectory():void {
 const dialog=document.getElementById('belleInstagramDialog') as HTMLDialogElement|null;
 if(!dialog)return;
 let opener:HTMLElement|null=null;
 document.addEventListener('click',event=>{
  const target=event.target;
  if(!(target instanceof Element))return;
  const trigger=target.closest<HTMLElement>('[data-instagram-directory]');
  if(!trigger)return;
  event.preventDefault();
  opener=trigger;
  if(!dialog.open){
   try{dialog.showModal();}
   catch{
    const profile=dialog.querySelector<HTMLAnchorElement>('a[href^="https://www.instagram.com/"]');
    if(profile)window.open(profile.href,'_blank','noopener,noreferrer');
   }
  }
 });
 dialog.addEventListener('click',event=>{
  if(event.target===dialog)dialog.close();
 });
 dialog.addEventListener('close',()=>{
  if(opener?.isConnected)opener.focus({preventScroll:true});
  opener=null;
 });
}
