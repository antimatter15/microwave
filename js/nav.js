//navigation stuffs
var lastscrolled = ""
function blip_scroll(index){
  try{
    msg.data.blips[lastscrolled].info.className = 'info';
  }catch(err){};
  lastscrolled = chronological_blips[index];
  if(msg.data.blips[chronological_blips[index]].dom){
    msg.data.blips[lastscrolled].info.className = 'info selected';
		var blip = msg.data.blips[chronological_blips[index]].dom;
		if(!opt.touchscroll){
			blip.scrollIntoView(true);
		}else{
			//this totally screws up iPad/Touchscroll
			touchscroll0.scrollTo(0, blip.offsetTop)
		}
   return true;
  }
  return false;
}


function scroll_wavepanel(pos){
	if(opt.multipane){
		if(opt.touchscroll){
			touchscroll0.scrollTo(0, pos)
		}else{
			document.getElementById('wave_container').scrollTop = pos;
		}
	}else{
		scrollTo(0, pos)
	}
}

function scroll_searchpanel(pos){
	if(opt.multipane){
		if(opt.touchscroll){
			touchscroll1.scrollTo(0, pos)
		}else{
			document.getElementById('search_parent_container').scrollTop = pos;
		}
	}else{
		scrollTo(0, pos)
	}
}

function blip_next(id){
  try{
    if([].indexOf){
      var index = chronological_blips.indexOf(id);
    }else{
      //copied from MAH AWESUM VX JS LIBRARY
      var indexFn = function(v,a,i){for(i=a.length;i--&&a[i]!=v;);return i};
      var index = indexFn(id, chronological_blips);
    }
    while(index && blip_scroll(--index) == false){}

  }catch(err){
  }
}

////blow is the floaty bar
function hide_float(){
  document.getElementById('floating_menu').className = ""
}

function markWaveRead(){
  wave.robot.folderAction('markAsRead', current_wave, current_wavelet);
  hide_float(); //provide user a visual indication that something happened
  search_outdated = true;
  runQueue();
}


function archiveWave(){
  wave.robot.folderAction('archive', current_wave, current_wavelet);
  hide_float();
  runQueue();
}



window.onresize = document.onscroll = window.onscroll = function(){
  if(current_page == 0){
    searchscroll = scrollY;
  }
  var load = document.getElementById("loading");
  load.style.top = scrollY+'px';
  document.getElementById('floating_menu').style.top = (scrollY+window.innerHeight-50)+'px';
}

if(mobilewebkit){
  setInterval(document.onscroll, 1000);
}

function toggle_float(){
  if(document.getElementById('floating_menu').className == "expanded"){
    document.getElementById('floating_menu').className = "";
  }else{
    document.getElementById('floating_menu').className = "expanded";
  }
}

