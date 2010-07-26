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
		scroll_wavepanel(blip.offsetTop)
   return true;
  }
  return false;
}

function blip_index(id){
	if([].indexOf){
		var index = chronological_blips.indexOf(id);
	}else{
		//copied from MAH AWESUM VX JS LIBRARY
		var indexFn = function(v,a,i){for(i=a.length;i--&&a[i]!=v;);return i};
		var index = indexFn(id, chronological_blips);
	}
	return index;
}

function blip_next(id){
  try{
    var index = blip_index(id);
    while(index && blip_scroll(--index) == false){}
  }catch(err){
  }
}

function blip_prev(id){
  try{
    var index = blip_index(id), cbl = chronological_blips.length;
    if(index < 0) return;
    while(index < cbl && blip_scroll(++index) == false){}
  }catch(err){
  }
}

function animated_scroll(el, pos){
	var isWin = el==window;
	var startpos = isWin?pageYOffset:el.scrollTop; //pageyOffset seems like somethings wrong
	if(startpos == pos) return;
	var time = Math.min(1000,2*Math.sqrt(42*Math.abs(pos-startpos)));
	var fn, target = +new Date + time;
	;(fn = function(){
		var progress = Math.min(1, 1 - ((target - new Date)/time));
		var val = (pos-startpos)*progress + startpos;
		if(isWin) scrollTo(0, val); else{
			el.scrollTop = val;
		}
		if(progress < 1) setTimeout(fn, 0);
	})()
}

function scroll_wavepanel(pos){
	if(opt.multipane){
		var wcp = document.getElementById('wave_container_parent');
		pos = pos<0?(wcp.scrollHeight+1+pos):pos;
		if(opt.touchscroll){
			touchscroll0.scrollTo(0, pos); //todo: animate this
		}else{
			if(opt.no_animate){
				wcp.scrollTop = pos;
			}else{
				animated_scroll(wcp, pos);
			}
		}
	}else{
		pos = pos<0?(innerHeight+1+pos):pos;
		if(opt.no_animate){
			scrollTo(0, pos);
		}else{
			animated_scroll(window, pos);
		}
	}
}

function scroll_searchpanel(pos){
	if(opt.multipane){
		var spc = document.getElementById('search_parent_container');
		pos = pos<0?(spc.scrollHeight+1+pos):pos;
		if(opt.touchscroll){
			touchscroll1.scrollTo(0, pos)
		}else{
			if(opt.no_animate){
				spc.scrollTop = pos;
			}else{
				animated_scroll(spc, pos)
			}
		}
	}else{
		pos = pos<0?(innerHeight+1+pos):pos;
		if(opt.no_animate){
			scrollTo(0, pos)
		}else{
			animated_scroll(window, pos);
		}
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

