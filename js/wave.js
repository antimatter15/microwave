var chronological_blips = [];
function loadWave(waveId, waveletId){  
  var loadId = loading(waveId);
  if(onLine() == false) return window.offline_loadWave(waveId);
  var blipNavId = null;
	var matches, waveidregex = /(\w+\.\w+)\/(w\+\w+)\/\~\/(\w+\+\w+)\/(b\+\w+)/; //matches googlewave.com/w+dsf/~/conv+root/b+dsf
	if(matches = waveId.match(waveidregex)){
		waveId = matches[1]+'!'+matches[2];
		waveletId = matches[1]+'!'+matches[3];
		blipNavId = matches[4];
	}else{
		waveId = waveId.replace("/", '!');
  	waveletId = waveletId || waveId.replace(/[\/!].+/,'!conv+root');
	}
  var load_callback = function(waveContent){
    loading(loadId);
    console.log(waveContent);
    window.msg = waveContent;
    if(msg.error){
      if(msg.error.message.indexOf('not a participant') != -1){
        alert('You are not a participant of the wave/wavelet. ')
        //\nThis may be due to a bug in the current version of the data api which does not allow acces
        //s to waves unless you are explicitly a participant. don\'t blame me'
        return true;
      }else{
        return false;
      }
    }
    
    if(!waveContent.data.waveletData){
      alert('The server sent nothing')
      return;
    }

    searchmode(1);
    
    if(!opt.multipane){
      search_container.style.display = 'none';
    }
    
    current_page = 1;

    wave_container.style.display = '';
    window.onscroll();
    document.getElementById('floating_menu').style.display = '';
    if(!opt.no_autoscroll){ //ignore if zero or undefined
      //Okay, so now what? Uh.
      if(Object.keys){
        var blips = Object.keys(msg.data.blips);
      }else{
        var blips = []
        for(var blip in msg.data.blips) blips.push(blip);
      }
      chronological_blips = blips.sort(function(b, a){
        return msg.data.blips[a].lastModifiedTime - msg.data.blips[b].lastModifiedTime
      });
    }
    scrollto_position = -1;
    if(!auto_reload){
      if(!opt.no_scrollhistory){
        scrollTo(0,0);
        if(!opt.no_autoscroll){
          if(unread_blips[waveId]){ //ignore if zero or undefined
            //scrollto_blipid = chronological_blips[0];
            scrollto_position = unread_blips[waveId];
						//if there are unread blips, scroll to the blip that was modified
						//the unread'th place, this is hard to explain
          }
        }
				if(blipNavId){
					try{
						scrollto_position = chronological_blips.indexOf(blipNavId);
					}catch(err){}
				}
      }
    }
    
    auto_reload = false;
    if(!opt.multipane) document.getElementById('suggest').style.display = 'none';
    wave_container.innerHTML = ''
    
    //'<div class="wavelet" onclick="wave.robot.folderAction(\'markAsRead\', current_wave)">Mark wave as <b>Read</b> </div>';
    if(opt.owner_utils && msg.data.waveletData.participants[0] == username){
      wave_container.innerHTML += '<div><button onclick="set_user_mode()">Everyone Read Only</button><button onclick="set_user_mode(\'FULL\')">Everyone Full Access</button></div>';
    }
    
    var header = document.createElement('div');
    header.className = 'wavelet';
    //header.innerHTML = "<b>By </b> ";
    var add = document.createElement('a');
    add.innerHTML = ' Add'
    add.className = 'addparticipant';
		add.style['float'] = "right";
    add.href="javascript:void(0)";
    add.onclick = function(){
      var participant = prompt('Enter Participant ID to Add');
      if(participant){
        if(participant.indexOf("@") == -1){
          participant += "@googlewave.com";
        }
        wave.wavelet.participant.add(participant, waveId, waveletId);
        loadWave(waveId);
        auto_reload = true;
        runQueue();
      }
    }
    header.appendChild(add);
		
    header.appendChild(userList(waveContent.data.waveletData.participants));
    
    wave_container.appendChild(header);

    current_wave = waveId = waveId.replace(/\s/,'');
    current_wavelet = waveletId;
    
    var wavedata = document.createElement('div');
    wave_container.appendChild(wavedata);
    
    
    if(document.getElementById("chronos").checked){
      chronological_blip_render(wavedata)
    }else{
      if(opt.recursive_renderer || !msg.data.waveletData.rootThread){
        recursive_blip_render(msg.data.waveletData.rootBlipId, wavedata);
      }else{
        bootstrap_thread_render(wavedata);
      }
    }
    var tags = document.createElement('div');
    var t = waveContent.data.waveletData.tags.join(', ');
    if(t.length == 0) t = "(None)";
    tags.innerHTML = "<b>Tags:</b> "; //todo: fix xss risk
    tags.innerHTML = ' <a href="javascript:add_tag()" style="float:right">Add</a>';
    tags.appendChild(document.createTextNode(t))
    tags.className = 'tags';
    wave_container.appendChild(tags);
    var footer = document.createElement('div');
    footer.innerHTML = '<a href="https://wave.google.com/wave/#restored:wave:'+escape(escape(waveId))+'" target="_blank">Open this wave in the official wave client</a>';
    footer.className = 'footer';
    wave_container.appendChild(footer);
		wave_container.appendChild(document.createElement('br'))
  }
  if(opt.prefetch && prefetched_waves[waveId]){
    load_callback(JSON.parse(JSON.stringify(prefetched_waves[waveId])));
  }else{
    callbacks[wave.robot.fetchWave(waveId, waveletId)] = load_callback;
  }
}
