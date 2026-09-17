(function(){
  'use strict';
  const btn=document.getElementById('themeToggle');
  if(btn){
    btn.addEventListener('click',function(){
      const dark=document.documentElement.dataset.theme==='dark';
      document.documentElement.dataset.theme=dark?'light':'dark';
      try{localStorage.setItem('ilmf-theme',dark?'light':'dark');}catch(e){}
    });
  }
})();
