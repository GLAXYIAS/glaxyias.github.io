(function(){
  function isMineMsg(m){
    var su=String(m.sender_username||'').toLowerCase().trim();
    var sh=String(m.sender_handle||'').toLowerCase().trim();
    var me=String(localStorage.getItem('chatUser')||'').toLowerCase().trim();
    var mh='@'+me.replace(/\s+/g,'_');
    if(su&&me&&su===me)return true;
    if(sh&&sh===mh)return true;
    if(su&&('@'+su.replace(/\s+/g,'_'))===mh)return true;
    return false;
  }
  function partnerMatch(otherHandle, otherName){
    var oh=String(otherHandle||'').toLowerCase();
    var on=String(otherName||'').toLowerCase().trim();
    var oh2=oh.replace(/^@/,'').replace(/_/g,' ');
    return on===oh2 || on.replace(/\s+/g,'_')===oh.replace(/^@/,'') || ('@'+on.replace(/\s+/g,'_'))===oh;
  }
  async function relabelThread(otherHandle){
    try{
      var me=localStorage.getItem('chatUser')||'';
      var meL=me.toLowerCase().trim();
      var res=await fetch('https://apithingy.jlsniperelite4.workers.dev/private-messages');
      var data=await res.json();
      var rows=Array.isArray(data)?data:(data.messages||[]);
      var otherH=String(otherHandle||'').toLowerCase();
      var mine=rows.filter(function(m){
        var s=String(m.sender_username||'').toLowerCase();
        var r=String(m.recipient_username||'').toLowerCase();
        if(!(s===meL||r===meL))return false;
        var otherName=s===meL?r:s;
        return partnerMatch(otherH, otherName);
      });
      var root=document.getElementById('pm-thread-messages');
      var title=document.getElementById('pm-thread-title');
      if(!root)return;
      if(!mine.length)return;
      mine.sort(function(a,b){return new Date(a.created_at)-new Date(b.created_at);});
      var partner=title?title.textContent.trim():'User';
      root.innerHTML=mine.map(function(msg){
        var mineMsg=isMineMsg(msg);
        var time=new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        var name=mineMsg?'You':partner;
        var side=mineMsg?'my-message-wrapper':'other-message-wrapper';
        var bubble=mineMsg?'my-bubble-color':'other-bubble-color';
        var body=String(msg.content||'');
        if(body.indexOf('[[IMG]]')===0) body='[Image]';
        else body=body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return '<div class="message-wrapper '+side+'">'+'<div class="message-content-node"><div class="message-meta-header">'+'<span><strong>'+name+'</strong></span>'+'<span class="message-timestamp">'+time+'</span></div>'+'<div class="message-text-bubble '+bubble+'">'+body+'</div></div></div>';
      }).join('');
      root.scrollTop=root.scrollHeight;
    }catch(e){console.error('[pm-label-fix]',e);}
  }
  var tries=0;
  var t=setInterval(function(){
    tries++;
    if(typeof window.openPmConversation==='function' && !window.openPmConversation.__labelFixed){
      var orig=window.openPmConversation;
      window.openPmConversation=function(otherHandle){
        orig.apply(this,arguments);
        setTimeout(function(){ relabelThread(otherHandle); },50);
      };
      window.openPmConversation.__labelFixed=true;
      console.log('[pm-label-fix] hooked');
    }
    if(typeof window.openPmWithUser==='function' && !window.openPmWithUser.__labelFixed){
      var orig2=window.openPmWithUser;
      window.openPmWithUser=function(username){
        orig2.apply(this,arguments);
        setTimeout(function(){
          var h='@'+String(username||'').toLowerCase().replace(/\s+/g,'_');
          relabelThread(h);
        },50);
      };
      window.openPmWithUser.__labelFixed=true;
    }
    if(tries>60)clearInterval(t);
  },200);
  document.addEventListener('click',function(e){
    var item=e.target.closest('.pm-convo-item');
    if(item){
      setTimeout(function(){
        var title=document.getElementById('pm-thread-title');
        var name=title?title.textContent.trim():'';
        if(!name)return;
        relabelThread('@'+name.toLowerCase().replace(/\s+/g,'_'));
      },120);
    }
  });
})();
