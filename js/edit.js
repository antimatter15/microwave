//crappy diff algorithm which handles simple replace cases
//hello world blah blah blah blah blah cheetoes blah blah blah
//hello world blah blah blah blah cheetoes blah blah blah
//returns range of change:        [  ] -> []
//example:
//> diff('the huge cute pink elephant ate children',
//       'the huge cute gray elephant ate children')
//[14, 18, "gray"]
function diff(a, b){
  var al = a.length, bl = b.length, s = -1, e = -1;
  while(s++ < al && a[s] == b[s]);
  while(e++ < al && a[al-e] == b[bl-e]);
  return [s,al-e+1,b.substring(s,bl-e+1)]
}


var current_blip = null, context_box, reply_box, reply_text, cancel, post;
function create_reply_box(indented){
  if(window.content_box){
    try{
    content_box.innerHTML = '';
    content_box.parentNode.removeChild(content_box)
    }catch(err){};
  }
  //if(!context_box || context_box.innerHTML == ''){ //ie does suck doesnt it
    context_box = document.createElement('div');
    reply_box = document.createElement('div');
    reply_box.innerHTML = "<div class='alert'><b>Write a Reply</b></div>"
    reply_text = document.createElement('textarea');
    cancel = document.createElement('button');
    post = document.createElement('button');
    //post.style['float'] = 'right';
    //cancel.style['float'] = 'right';
    cancel.innerHTML = 'Cancel';
    post.innerHTML = 'Post';
    cancel.onclick = function(){
      if(reply_text.value.split(' ').length < 42 || confirm("Are you sure you want to cancel?")){
        context_box.style.display = 'none';
        current_blip = null;
      }
    }
    post.onclick = function(){
      reply_text.disabled = "disabled";
      setTimeout(function(){
        //if(indented){
          wave.blip.contentCreateChild(reply_text.value,current_blip.blipId,current_blip.waveId,current_blip.waveletId);
          //wave.blip.contentContinueThread(reply_text.value,current_blip.blipId,current_blip.waveId,current_blip.waveletId);
        //}else{
        //  wave.wavelet.appendBlip(reply_text.value, current_blip.blipId, current_blip.waveId, current_blip.waveletId);
        //}
        loadWave(current_blip.waveId);
        auto_reload = true;
        runQueue()
      },100);
    }
    context_box.style.marginTop = '10px';
    reply_box.appendChild(reply_text);
    reply_box.appendChild(post);
    reply_box.appendChild(cancel);
    context_box.appendChild(reply_box);
  //}
  context_box.style.display = 'none';
  reply_text.disabled = "";
  
  var addonsig = '';
  if(navigator.userAgent.indexOf("Opera Mini") != -1){
    addonsig = " on Opera Mini"
  }else if(mobilewebkit){
    if(navigator.userAgent.indexOf('Android') != -1){
      addonsig = " on Android";
    }else if(navigator.userAgent.indexOf("iPad") != -1){
      addonsig = " on iPad"
    }else if(navigator.userAgent.indexOf("iPod") != -1){
      addonsig = " on iPod"
    }else{
      addonsig = " on iPhone"
    }
  }
  
  reply_text.value = '';
  
  if(!opt.no_sig) reply_text.value = '\n\nPosted with micro-wave.appspot.com'+addonsig;
  reply_text.className = 'reply_box';
  return context_box;
}


ctx_menu = null;


function create_contextmenu(blip){
  if(!onLine()) return document.createElement('div'); 
//offline doesnt support queuing operations to be done when online, 
//so just dont show prompts

  function closectx(){
    div.style.display = 'none';
    div.parentNode.removeChild(div);
  }
  try{
    ctx_menu.style.display = 'none'
    ctx_menu.parentNode.removeChild(ctx_menu);
  }catch(err){}
  var div = document.createElement("div");
  current_blip = blip;
  div.style.zIndex = 32;
  var actions = {
    "Reply": function(){
      current_blip.dom.parentNode.insertBefore(create_reply_box(),current_blip.dom.nextSibling);
      context_box.className = blip.childBlipIds.length > 0?"thread":"";
      context_box.style.display = '';
      reply_text.focus();
      closectx();
    },/*
    "Indented": function(){
      current_blip.dom.parentNode.insertBefore(create_reply_box(true),current_blip.dom.nextSibling);
      context_box.className = blip.childBlipIds.length > 0?"thread":"";
      context_box.style.display = '';
      reply_text.focus();
      closectx();
    },*/
    "Delete": function(){
      if(confirm("Are you sure you want to delete the blip?")){
        setTimeout(function(){
          wave.blip['delete'](current_blip.blipId,current_blip.waveId,current_blip.waveletId);
          loadWave(current_blip.waveId);
          auto_reload = true;
          runQueue();
          closectx();
        },100);
      }
      closectx();
    },
    "Edit": function(){
      current_blip.dom.parentNode.insertBefore(create_edit_box(),current_blip.dom.nextSibling);
      //TODO: MAKE THIS PURTIER
      var rep_start = 0;
      try{
        if(current_blip.annotations[0].name == 'conv/title') rep_start = current_blip.annotations[0].range.end;
      }catch(err){}
      
      edit_text.value = current_blip.content.substr(rep_start + 1); //first char is a newline
      edit_text.focus();
      closectx();
    }
  };
  if(blip.blipId == msg.data.waveletData.rootBlipId){
    actions['Change Title'] = function(){
      var title = prompt("Enter new wavelet title", msg.data.waveletData.title);
      if(title){
        wave.wavelet.setTitle(title, blip.waveId, blip.waveletId);
        loadWave(blip.waveId, blip.waveletId);
        auto_reload = true;
        runQueue();
      }
    }
    /*actions['Mark Wave Read'] = function(){
      wave.robot.folderAction('markAsRead', blip.waveId, blip.waveletId)
      closectx();
      runQueue();
    }*/
    
  }
  
  for(var a in actions){
    var link = document.createElement("a");
    link.href="javascript:void(0)";
    link.onclick = actions[a];
    link.innerHTML = a;
    div.appendChild(link);
    div.appendChild(document.createTextNode(' / '));
  }
  var link = document.createElement("a");
  link.href="javascript:void(0);";
  link.style.color = 'red';
  link.innerHTML = "Close";
  link.onclick = function(){
    closectx();
  }
  div.appendChild(link);
  div.className = "contextmenu";
  ctx_menu = div;
  return div
}


function create_edit_box(){
  edit_box = document.createElement('div');
  edit_box.style.marginRight = "6px";
  edit_box.innerHTML = "<div class='alert'><b>Edit Blip (Beta)</b></div>"
  edit_text = document.createElement('textarea');
  cancel_edit = document.createElement('button');
  submit_edit = document.createElement('button');
  cancel_edit.innerHTML = 'Cancel';
  submit_edit.innerHTML = 'Submit';
  cancel_edit.onclick = function(){
    edit_box.style.display = 'none';
    current_blip = null;
  }
  submit_edit.onclick = function(){
    edit_text.disabled = "disabled";
    setTimeout(function(){
      var rep_start = 0;
      try{
        if(current_blip.annotations[0].name == 'conv/title') rep_start = current_blip.annotations[0].range.end;
        //TODO: replace this with something which always works, sometimes it doesn't when there's an annotation above it
      }catch(err){}
      
      
      var change = diff(current_blip.content.substr(rep_start), '\n'+edit_text.value);
      console.log(change);
      console.log(current_blip.content, '\n'+edit_text.value)
      
      wave.blip.replace_range(change[2], 
                              rep_start + change[0], 
                              rep_start + change[1], 
                              current_blip.blipId, current_blip.waveId, current_blip.waveletId)
      loadWave(current_blip.waveId);
      auto_reload = true;
      runQueue()
    },100);
  }
  edit_box.style.marginTop = '10px';
  edit_box.appendChild(edit_text);
  edit_box.appendChild(submit_edit);
  edit_box.appendChild(cancel_edit);
  
  var boxheight = Math.max(current_blip.dom.offsetHeight,100)
  edit_text.style.height = boxheight+'px';
  edit_text.className = 'edit_box'

  return edit_box;
}