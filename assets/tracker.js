(function(){
  'use strict';
  var EP='/api/events';
  var TK='k7x9m2vQ';
  var sid=sessionStorage.getItem('_tr_sid');
  if(!sid){sid=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('_tr_sid',sid)}

  var _utmCache=null;
  function utms(){
    if(_utmCache)return _utmCache;
    var p=new URLSearchParams(location.search);
    var o={};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','click_id','CampaignID','pixel_id'].forEach(function(k){
      var v=p.get(k);if(v)o[k]=v;
    });
    if(Object.keys(o).length)sessionStorage.setItem('_tr_utms',JSON.stringify(o));
    else{var s=sessionStorage.getItem('_tr_utms');if(s)try{o=JSON.parse(s)}catch(e){}}
    _utmCache=o;
    return o;
  }

  function getUrlWithUtm(url){
    var u=utms();var keys=Object.keys(u);
    if(!keys.length)return url;
    var sep=url.indexOf('?')>-1?'&':'?';
    return url+sep+keys.map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(u[k])}).join('&');
  }

  function productFromPath(){
    var m=location.pathname.match(/produtos\/([^\/]+)/);
    return m?m[1]:null;
  }

  function pageId(){
    var p=location.pathname.replace(/\/index\.html$/,'').replace(/\/$/,'').replace(/^\//,'');
    return p||'home';
  }

  function send(evt,extra){
    var data={e:evt,sid:sid,page:pageId(),ts:Date.now(),u:utms(),tk:TK};
    if(extra)for(var k in extra)data[k]=extra[k];
    var payload=JSON.stringify(data);
    try{
      if(navigator.sendBeacon){navigator.sendBeacon(EP,payload)}
      else{var x=new XMLHttpRequest();x.open('POST',EP,true);x.setRequestHeader('Content-Type','application/json');x.send(payload)}
    }catch(e){}
  }

  send('pageview');

  document.addEventListener('click',function(ev){
    var el=ev.target.closest('a[href*="produtos/"],button[onclick*="produtos/"]');
    if(el){
      var href=el.getAttribute('href')||'';
      if(!href){var oc=el.getAttribute('onclick')||'';var m2=oc.match(/'([^']+)'/);if(m2)href=m2[1]}
      var pm=href.match(/produtos\/([^\/]+)/);
      if(pm)send('product_click',{product:pm[1]});
    }

    var buy=ev.target.closest('[onclick*="checkout."],a[href*="checkout."]');
    if(buy){
      var prod=productFromPath();
      send('buy_click',{product:prod||'unknown'});
    }

    var coupon=ev.target.closest('#cpnClaimHome,.cpn-btn');
    if(coupon)send('coupon_claim');

    var upsell=ev.target.closest('#paymentButton,[onclick*="checkout."]');
    if(upsell&&location.pathname.indexOf('/up/')>-1){
      var upMatch=location.pathname.match(/up\/([^\/]+)/);
      send('upsell_click',{upsell:upMatch?upMatch[1]:'unknown',product:productFromPath()});
    }
  },true);

  if(location.pathname.indexOf('/carta')>-1)send('carta_view');

  var _enter=Date.now();
  function sendDwell(){
    var sec=Math.round((Date.now()-_enter)/1000);
    if(sec>1&&sec<1800)send('page_leave',{dwell:sec});
  }
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')sendDwell()});
  window.addEventListener('pagehide',sendDwell);

  window._tr={send:send,getUrlWithUtm:getUrlWithUtm};
})();
