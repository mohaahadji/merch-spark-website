(() => {
 const button=document.querySelector('.menu-toggle'),menu=document.querySelector('#mobile-menu');
 button?.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.hidden=!open;});
 menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation');}));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu&&!menu.hidden){menu.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation');button.focus();}});
 // Preserve earlier bookmarked workspace deep links after moving the tool inside.
 if(['discover','keywords','saved'].includes(location.hash.slice(1))){const url=new URL('research/',location.href);url.hash=location.hash;location.replace(url.href);}
})();
