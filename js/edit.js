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


var current_blip = null;
var ctx_menu = null;


function create_magic_box(name, submit_callback){
  var parent = document.createElement('div');
  parent.style.marginRight = "6px";
  parent.innerHTML = "<div class='alert'>"+name+"</div>"
  var textbox = document.createElement('textarea');
  var cancelbtn = document.createElement('button');
  var submitbtn = document.createElement('button');
  cancelbtn.innerHTML = 'Cancel';
  submitbtn.innerHTML = 'Submit';
  cancelbtn.onclick = function(){
    parent.style.display = 'none';
    current_blip = null;
    if(textbox.value.split(' ').length < 42 || confirm("Are you sure you want to cancel?")){
			parent.style.display = 'none';
			current_blip = null;
		}
  }
  submitbtn.onclick = function(){
    textbox.disabled = "disabled";
    submitbtn.disabled = 'disabled';
    setTimeout(function(){
      submit_callback(textbox.value);
    },100);
  }
  

  
  parent.style.marginTop = '10px';
  parent.appendChild(textbox);
  parent.appendChild(submitbtn);
  parent.appendChild(cancelbtn);
  parent.textbox = textbox; //i sure hope this isn't leaky
  

  return parent;
}



function create_edit_box(){
	var box = create_magic_box('<b>Edit blip</b> (Beta)', function(value){
		var rep_start = 0;
		try{
			for(var l = current_blip.annotations.length, i = 0;
				i < l && current_blip.annotations[i].name != 'conv/title'; i++){};
			if(i < l) rep_start = current_blip.annotations[i].range.end;
		}catch(err){}
		
		var change = diff(current_blip.content.substr(rep_start), '\n'+value);
		console.log(change);
		console.log(current_blip.content, '\n'+edit_text.value)
		
		wave.blip.replace_range(change[2], 
														rep_start + change[0], 
														rep_start + change[1], 
														current_blip.blipId, current_blip.waveId, current_blip.waveletId)
		loadWave(current_blip.waveId);
		auto_reload = true;
		runQueue()
	})
	
	var edit_text = box.textbox;
	var boxheight = Math.max(current_blip.dom.offsetHeight,100)
  edit_text.style.height = boxheight+'px';
  edit_text.className = 'edit_box'
  
  return box;
}


function create_reply_box(indented){ //REMEMBER TO REMOVE INFO ONCE GOOGLE FIXES THE BUG
	var info = '';
	if(!indented){
		info = ' Note the current version of the wave data API does not support creating continuations of a thread, thus all responses will be indented. Hopefully, this will be fixed shortly.'
		indented = true;
	}
	var box = create_magic_box('<b>Write a Reply</b>'+info, function(value){
		if(indented){
			wave.blip.contentCreateChild(value,current_blip.blipId,current_blip.waveId,current_blip.waveletId);
		}else{
			wave.blip.contentContinueThread(value,current_blip.blipId,current_blip.waveId,current_blip.waveletId);
		}
		loadWave(current_blip.waveId);
		auto_reload = true;
		runQueue()
	})

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
  
  if(!opt.no_sig) box.textbox.value = '\n\nPosted with micro-wave.appspot.com'+addonsig;
  
  box.textbox.className = 'reply_box';
  
  return box
}





function create_contextmenu(blip){
  if(!onLine()) return document.createElement('div'); 
	//offline doesnt support queuing operations to be done when online, 
	//so just dont show prompts

  function closectx(){
    div.style.display = 'none';
    div.parentNode.removeChild(div);
  }
  
  if(ctx_menu){
		ctx_menu.style.display = 'none'
		if(ctx_menu.parentNode) ctx_menu.parentNode.removeChild(ctx_menu);
		delete ctx_menu;
	}
	
  var div = document.createElement("div");
  current_blip = blip;
  div.style.zIndex = 32;
  var actions = {
    "Reply": function(){
      
      window._gaq && _gaq.push(['_trackEvent', 'Modify', 'Create Reply']);
      //context_box.className = blip.childBlipIds.length > 0?"thread":""; //this used to suffice, but not so much anymore
      
      try{
				var thread = blip.threadId?msg.data.threads[blip.threadId].blipIds:msg.data.waveletData.rootThread.blipIds, 
						tpos = thread.indexOf(blip.blipId);
						
				if(thread.length -1 == tpos){
					//last one: no indent
					
					var box = create_reply_box()
					box.className = ""; //this used to suffice, but not so much anymore
				}else{
					//not last one: indent
					var box = create_reply_box(true)
					box.className = "thread"; //this used to suffice, but not so much anymore
				}
			}catch(err){}
      
			current_blip.dom.parentNode.insertBefore(box,current_blip.dom.nextSibling);
      box.textbox.focus();
      closectx();
    },//*
    "Indented": function(){
			window._gaq && _gaq.push(['_trackEvent', 'Modify', 'Create Indented Reply']);
			var box = create_reply_box(true);
      current_blip.dom.parentNode.insertBefore(box,current_blip.dom.nextSibling);
      box.className = "thread";
      box.textbox.focus();
      closectx();
    },//*/
    "Delete": function(){
			if(confirm("Are you sure you want to delete the blip?")){
				window._gaq && _gaq.push(['_trackEvent', 'Modify', 'Delete existing blip']);
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
			window._gaq && _gaq.push(['_trackEvent', 'Modify', 'Edit existing blip']);
			var box = create_edit_box();
      current_blip.dom.parentNode.insertBefore(box,current_blip.dom.nextSibling);
      
      //TODO: MAKE THIS PURTIER
      var rep_start = 0;
      try{
        for(var l = current_blip.annotations.length, i = 0;
          i < l && current_blip.annotations[i].name != 'conv/title'; i++){};
        if(i < l) rep_start = current_blip.annotations[i].range.end;
      }catch(err){}
      
      box.textbox.value = current_blip.content.substr(rep_start + 1); //first char is a newline
      box.textbox.focus();
      closectx();
    }/*,
    "Attach File": function(){
			wave.blip.upload_attachment(btoa('hello world'), 'helloworld.txt', current_blip.blipId, current_blip.waveId, current_blip.waveletId);
			loadWave(current_blip.waveId);
			runQueue();
			closectx();
		}*/
  };
  if(blip.blipId == msg.data.waveletData.rootBlipId){
    actions['Title'] = function(){
      var title = prompt("Enter new wavelet title", msg.data.waveletData.title);
      window._gaq && _gaq.push(['_trackEvent', 'Modify', 'Change Wavelet Title']);
      if(title){
        wave.wavelet.setTitle(title, blip.waveId, blip.waveletId);
        loadWave(blip.waveId, blip.waveletId);
        auto_reload = true;
        runQueue();
      }
    }
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

