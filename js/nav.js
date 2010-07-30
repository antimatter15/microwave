//navigation stuffs
var lastscrolled = ""
var gstates = {};


function blip_scroll(index){
	if(index < 0) index = chronological_blips.length + index;
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
    var index = blip_index(id), cbl = chronological_blips.length-1;
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
		
		var val = (pos-startpos)*((-Math.cos(progress*Math.PI)/2) + 0.5) + startpos;
		
		if(isWin) scrollTo(0, val); else{
			el.scrollTop = val;
		}
		if(progress < 1) setTimeout(fn, 0);
	})()
}

function scroll_wavepanel(pos){
	var wcp = getEl('wave_container_parent');
	pos = pos<0?(wcp.scrollHeight+1+pos):pos;
	if(opt.multipane){
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
	var spc = getEl('search_parent_container');
	pos = pos<0?(spc.scrollHeight+1+pos):pos;
	if(opt.multipane){
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
  getEl('floating_menu').className = ""
}

function markWaveRead(){
	var l = loading('mark as read');
	window._gaq && _gaq.push(['_trackEvent', 'Mark', 'Mark wave read']);
  callbacks[wave.robot.folderAction('markAsRead', current_wave, current_wavelet)] = function(){
		loading(l)
	};
  hide_float(); //provide user a visual indication that something happened
  search_outdated = true;
  runQueue();
}


function archiveWave(){
	var l = loading('archive wave');
	window._gaq && _gaq.push(['_trackEvent', 'Mark', 'Mark wave archived']);
  callbacks[wave.robot.folderAction('archive', current_wave, current_wavelet)] = function(){
		loading(l);
	};
  hide_float();
  runQueue();
}



function update_scroll(){
  if(current_page == 0){
    searchscroll = scrollY;
  }
  var load = getEl("loading");
  load.style.top = scrollY+'px';
  var pos = scrollY+window.innerHeight - 64
  
  if(mobilewebkit){
		getEl('floating_menu').style['-webkit-transform'] = 'translateY('+pos+'px)';
	}else{
		getEl('floating_menu').style.top = pos+'px';
	}

}

window.onresize = document.onscroll = window.onscroll = update_scroll;



if(mobilewebkit){
  setInterval(document.onscroll, 500);
  //document.addEventListener('touchmove', update_scroll);
}


function flicker(el,status){
	//UI design 101: Provide user a visible indication that any action is actually being done.
	getEl('floating_menu').style.backgroundColor = '#D1FCC9'
	el.style.color = 'green';
	el.style.fontWeight = 'bold';
	setTimeout(function(){
		el.style.color = '';
		el.style.fontWeight = '';
		getEl('floating_menu').style.backgroundColor = '';
	},500)
}

