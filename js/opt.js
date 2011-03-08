/*
 Copyright 2010 antimatter15

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

opt.appName = '&mu;wave' //set the app name


opt.x.multipane = 'Enable multipane viewing experience (note, you must reload the page for changes to take effect)'
opt.x.touchscroll = "Add the TouchScroll library to do cool scrolly things on iPad Multipane (do not use on Desktop)"

opt.x.no_animate = "Disable animated scrolling effect";

opt.x.no_scrollhistory = "Do not save search scroll position and restore to it"
opt.x.old_results = "Old results panel style";

//opt.x.offline = "Automatically cache inbox when online to support offline mode";

opt.x.largeFont = 'Use a larger font';

opt.x.prefetch = "Prefetch waves and load them, way faster and also not real time";

opt.x.gadgets = 'Enable real wave gadget support (slow on mobile)';
opt.x.render_state = 'If a gadget can not be internally rendered, display the gadget state';

opt.x.bigspace = "Add a large blank space under waves so the keyboard isn't messed up"


opt.x.no_sig = 'Do not automatically add <i>posted with micro-wave</i> signature';


opt.x.use_protocol_21 = 'Use old 0.21 version of wave protocol';

opt.x.gsa = 'Show interface for changing gadget states (must have native gadgets enabled)';

opt.x.owner_utils = 'Enable utilities for wave creators';
opt.x.no_autoscroll = 'Disable smart autoscroll to latest blip';

opt.x.swipe = 'Enable swiping gesture to navigate between blips (swipe left = prev, swipe right = next)';

opt.x.keyboard = 'Enable keyboard shortcuts'


if(opt.gadgets === undefined && screen_size > 900){
  opt.fn.set('gadgets', true)
}


if(opt.bigspace === undefined && mobilewebkit){
	opt.fn.set('bigspace', true);
}

if(opt.swipe === undefined && mobilewebkit){
	opt.fn.set('swipe', true);
}

if(opt.multipane === undefined && (screen_size > 900 || navigator.userAgent.indexOf('iPad') != -1)){
  //default multipane on large screened
  opt.fn.set('multipane', true);
  if(mobilewebkit && opt.touchscroll === undefined){
    //default touchscroll on if multipane on for mobilewebkit
    opt.fn.set('touchscroll', true);
  }
}

var endQueue = []

function onReady(fn){
	endQueue.push(fn);
}


if(opt.multipane) {
  getEl('search_parent').insertBefore(getEl('appheader'), getEl('search_parent').firstChild)
  document.body.className += ' multipane';
  getEl('header').innerHTML = '&mu;wave';
  wave_container.innerHTML = "<div style='padding:40px'>No waves loaded yet</div>";
  if(location.hash.indexOf('search:') == -1){
    onReady(function(){
			autosearch('in:inbox')
			runQueue();
    });
  }
}



opt.c.largeFont = function(v){
  if(v == true){
    document.body.style.fontSize = '16px'
  }else{
    document.body.style.fontSize = '13px'
  }
}


var prefetched_waves = {};
var unread_blips = {};


opt.c.largeFont(opt.largeFont);

function runTouchScroll(elements){
	for(var i = 0; i < elements.length; i++){
	    var el = elements[i];
	    console.log(el);
	    if(typeof(el) == "string") el = getEl(el);
	    window['touchscroll'+i] = new TouchScroll(el, {elastic: true});
	}
}

function addTouchScroll(){
    var TS_CSS = 'js/lib/touchscroll.css';
    var TS_JS = 'js/lib/touchscroll.min.js';
    var elements = arguments;
		if(window.TouchScroll) return runTouchScroll(elements);
    var link = document.createElement('link');
    link.href = TS_CSS;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.body.appendChild(link);
    var script = document.createElement('script');
    script.src = TS_JS;
    script.onload = function(){
        setTimeout(function(){
					runTouchScroll(elements)
        },100)
    }
    document.body.appendChild(script)
} 

function reset_touchscroll(){
	var search_width = 250;
  getEl('wave_container_parent').style.width = (innerWidth-search_width)+'px';
  getEl('wave_container').style.width = (innerWidth-search_width)+'px';
  getEl('search_parent').style.width = search_width+'px';
  getEl('search_parent_container').style.width = search_width+'px';
}

if(opt.touchscroll && opt.multipane){
  addTouchScroll('wave_container_parent', 'search_parent_container')
	getEl('wave_container_parent').style.overflow = 'hidden'
  getEl('search_parent').style.overflow = 'hidden';
  getEl('search_parent_container').style.overflow = 'hidden';
  getEl('wave_container').style.overflow = 'hidden';
	reset_touchscroll()
	window.onorientationchange = reset_touchscroll;
	window.addEventListener('resize', reset_touchscroll, true)
}


if(opt.keyboard === undefined){
	opt.fn.set('keyboard', true)
}

if(opt.keyboard){
	document.body.onkeydown = function(e){
		if(!e || !e.target){
		}else if(e.target.tagName=='BODY'){
			if((e.shiftKey && e.keyCode == 32) || (!e.shiftKey && !e.ctrlKey && e.keyCode == 75)){
				//up
				blip_prev(lastscrolled);
				e.preventDefault();
			}else if(e.keyCode==32 || (!e.shiftKey && !e.ctrlKey && e.keyCode == 74)){
				//down
				blip_next(lastscrolled)
				e.preventDefault();
			}
		}
	}
}


if(opt.swipe){
	(function(){ //yay closures!
		var touchX = 0, touchY = 0, startTouchX = 0, startTouchY = 0, startTouchEl, touchEl, startTouchTime = 0;
		var ythresh = 30;
		var xthresh = 60;
		
		var tS = function(e){
			if(e.touches.length == 1){
				startTouchX = e.touches[0].pageX;
				startTouchY = e.touches[0].pageY;
				startTouchEl = e.touches[0].target;
				startTouchTime = +new Date;
			}
		};
		
		var tM = function(e){
			if(e.touches.length == 1){
				touchX = e.touches[0].pageX;
				touchY = e.touches[0].pageY;
				touchEl = e.touches[0].target;
			}
		};
		
		var tE = function(e){
			var tdelta = +new Date - startTouchTime;
			var xdelta = touchX - startTouchX;
			var ydelta = touchY - startTouchY;
			var xydelta = Math.sqrt(xdelta * xdelta + ydelta * ydelta) //good ol pythagoras
			var el = startTouchEl;
			if(!el) return;
			while(!el.blipId && el != document.body){
				el = el.parentNode;
			}
			if(el.blipId){
				if(Math.abs(ydelta) < ythresh && tdelta < 500){
					if(Math.abs(xdelta) > xthresh){
						if(xdelta > 0){
							//left
							blip_next(el.blipId);
						}else{
							//right  
							blip_prev(el.blipId);
						}
					}
				}
			}
		};
		if(mobilewebkit){
			document.body.addEventListener('touchstart', tS, true);
			document.body.addEventListener('touchmove', tM, true);
			document.body.addEventListener('touchend', tE, true);
		}else{
			document.body.addEventListener('mousedown', function(e){
				tS({touches:[e]})
			}, true);
			document.body.addEventListener('mousemove', function(e){
				tM({touches:[e]})
			}, true);
			document.body.addEventListener('mouseup', function(e){
				tE({touches:[e]})
			}, true);
		}
		
	})()
}
