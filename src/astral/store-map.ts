/** Load the real map only after an explicit map click. External directions remain available. */
export function initStoreMap(): void {
  const dialog=document.createElement('dialog');dialog.className='stores-map';
  dialog.innerHTML='<form method="dialog"><button autofocus aria-label="Fechar mapa">Fechar ×</button></form><h2>Encontre sua Belle</h2><iframe title="Google Maps — endereço da loja" referrerpolicy="no-referrer-when-downgrade"></iframe><a target="_blank" rel="noopener noreferrer">Abrir rotas no Google Maps ↗</a>';
  document.body.append(dialog);
  let trigger:HTMLElement|null=null;
  document.querySelectorAll<HTMLAnchorElement>('#lojas .store-card__map').forEach(link=>link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();trigger=link;
    const query=new URL(link.href).searchParams.get('query');
    dialog.querySelector('iframe')!.src=`https://maps.google.com/maps?q=${encodeURIComponent(query??'')}&output=embed`;
    dialog.querySelector('a')!.href=link.href;
    dialog.showModal();
  }));
  dialog.addEventListener('close',()=>{dialog.querySelector('iframe')!.src='about:blank';trigger?.focus();});
}
