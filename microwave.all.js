//File: js/lib/libopt.js


/*
  libopt.js
  
  A simple system and graphical user interface
  for handling application settings
  
  Concepts:
    - Permanent settings are stored in localStorage
    - Temporary settings are stored in the url search string
    - Everything is accessed through the global opt variable
    - Functions are namespaced to opt.fn
        eg: opt.fn.show (show settings interface)
    - The opt index is at opt.x
        it contains a list of opts with a human readable description
        if it starts with the word "number" or "string", it's the specified type
        
*/

window.opt || (opt = {});
opt.x = opt.x || {}; //descriptions
opt.c = opt.c || {}; //callbacks
opt.fn = {
  _el: 0,
  parse: function(x){
    if(x == 'false') return false;
    if(x == 'true') return true;
    if(parseFloat(x).toString() == x) return parseFloat(x);
    return x;
  },
  init: function(){
    var optarr = window.location.search.substr(1).split('&'), opt = {};
    if(window.localStorage){
      for (var k =0; k < localStorage.length; k++){
        var i = localStorage.key(k); 
        if(i.indexOf('opt_') == 0 && i.length) window.opt[i.substr(4)] = window.opt.fn.parse(localStorage[i]);
      }
    }
    for(var i = 0; i < optarr.length; i++){
      var itm = optarr[i].split('=');
      window.opt[itm[0]] = itm[1]?itm[1]:true;
    }
  },
  close: function(){
    if(opt.fn._el){
      try{
        opt.fn._el.parentNode.removeChild(opt.fn._el);
      }catch(err){}
    }
    opt.fn._el = 0;
  },
  show: function(){
    opt.fn.close();
    var e = opt.fn._el = document.createElement('div');
    var h = '<div style="padding:7px;padding-bottom:100px;"><h1 onclick="opt.fn.close()">'+(opt.appName||'')+' settings</h1>';
    for(var i in opt.x){
      h += '<input type="checkbox" name="'+i+'" id="'+i+'" '+(opt[i]?'checked':'')+' onchange="opt.fn.handleBoolean(this)"> <label for="'+i+'">'+opt.x[i]+' <i>('+i+')</i></label><br>';
    }
    h += '<br><button onclick="opt.fn.close()">Exit settings</button></div>'
    e.innerHTML = h;
    e.style.position = 'absolute';
    e.style.top = 0; e.style.left = 0;
    e.style.width = '100%';
    //e.style.height = '100%';
    
    e.style.backgroundColor = '#fff';
    e.style.padding = '0';
    e.style.zIndex = 99999999;
    e.onclick = function(e){
      e = e || window.event;
      var tag = (e.target||e.srcElement).tagName.toLowerCase();
      if(tag == "div"){
        window.opt.fn.close(); 
      }
    }
    document.body.appendChild(e);
  },
  handleBoolean: function(el){
    opt.fn.set(el.name, el.checked);
  },
  set: function(name, val){
    if(typeof opt.c[name] == 'function') val = opt.c[name](val) || val;
    opt[name] = val;
    if(window.localStorage) localStorage['opt_'+name] = val.toString();
  }
};
opt.fn.init();



//File: js/globals.js


if(!window.console) console = {log: function(){}};

function getEl(id){return document.getElementById(id)}

var screen_size = (document.documentElement.clientWidth||innerWidth), small_screen = (screen_size<500);
var loadIds = {};
var current_search = '';
var searchLastIndex = 0;
var edit_box, edit_text;
var search_container = getEl('search_container');
var wave_container = getEl('wave_container');
var mobilewebkit = navigator.userAgent.indexOf("WebKit") != -1 && navigator.userAgent.indexOf("Mobile")!=-1;
var current_wave = "";
var current_wavelet = "";
var auto_reload = false;
var lasthash = 'chunkybacon';
var current_page = 0; //0 = search, 1 = wave
var search_outdated = false;
var searchscroll = 0;
var scrollto_position = -1;


if(mobilewebkit) document.body.className += ' mobilewebkit'; //yeah i know browser detection is bad, but how do i get around it here? 

if(!window.onLine) window.onLine = function(){return true};





//File: js/offline.js


function searchStyle(waveId){
  if(cacheState[waveId] == 2){
    return 'fresh_cache';
  }else if(cacheState[waveId] == 1){
    return 'old_cache';
  }
  return '';
}

function onLine(){
	var val;
	if(opt.force_offline){
		val = false;
	}else if(navigator.onLine === undefined){
		val = true;
	}else{
		val = navigator.onLine;
	}
	if(val == false){
		var last_update = (+new Date - parseInt(localStorage.getItem('cache_last_updated')))/1000;
		if(!isNaN(last_update)){
			var status = '';
			if(last_update < 90) status = 'a minute';
			else if(last_update < 60*60) status = Math.ceil(last_update/60)+' minutes';
			else if(last_update < 60*60*24) status = Math.ceil(last_update/60/60)+' hours';
			else status = Math.ceil(last_update/60/60/24)+' days';
			getEl('offline_status').value = 'Offline (Cache '+status+' old)';
		}
	}
	return val;
}


var cachequeue = [], db = null;


function open_db(){
	if(!window.db && window.openDatabase){
		window.db = openDatabase('waves', '1.0', 'Offline Wave Cache', 1024 * 1024);
	}
}

function offline_cache(){
  if(onLine() == false) return;
  open_db();
  if(!window.db) return;
  db.transaction(function(tx){
		tx.executeSql("DROP TABLE inbox");
  })
  localStorage.setItem('cache_last_updated', +new Date);
  callbacks[wave.robot.search('in:inbox',0,42)] = function(msg){
    var item, digests = msg.data.searchResults.digests;
    for(var i = 0; i < digests.length; i++){
      item = digests[i];
      cachequeue.push(item);
    }
		setTimeout(cache_cycle, 1000);
  }
  runQueue();
}

var cacheState = {}; //0 = uncached, 1 = cached but outdated, 2 = cached and new
(function(){
	try{
		if(window.localStorage && localStorage.cacheState){
			var cs = JSON.parse(localStorage.getItem('cacheState'));
			for(var i = 0; i < cs.length; i++){
				cacheState[cs[i]] = 1;
			}
		}
	}catch(err){}
})();


function cache_cycle(){
	if(!window.db) return;
  var citem = null;
  if(citem = cachequeue.shift()){
	//console.log("caching wave" + citem.waveId);
    callbacks[wave.robot.fetchWave(citem.waveId, citem.waveId.replace(/w\+.+/g,'conv+root'))] = function(data){
	  //console.log('acquired data for' + citem.waveId);
      db.transaction(function (tx) {
		//console.log('fetched wave' + citem.waveId);
        tx.executeSql('CREATE TABLE IF NOT EXISTS inbox (waveid, result, data, date)');
        tx.executeSql('DELETE FROM inbox WHERE waveid = ?', [citem.waveId], function(tx, results){
          tx.executeSql('INSERT INTO inbox (waveid, result, data, date) VALUES (?, ?, ?, ?)', [citem.waveId, JSON.stringify(citem), JSON.stringify(data), new Date - 0], function(){
		  //console.log("done caching wave" + citem.waveId);
            if(getEl(citem.waveId))
				getEl(citem.waveId).className = "search fresh_cache";
            cacheState[citem.waveId] = 2;
			var cs = [];
			for(var i in cacheState){
				cs.push(i);
			}
			
			localStorage.setItem('cacheState', JSON.stringify(cs));
      setTimeout(cache_cycle, 1000);
    });

        });
      });
	  return true;
    }
	runQueue();
  }
}

function resultClass(waveId){
	if(!cacheState[waveId]){
		return '';
	}else if(cacheState[waveId] == 1){
		return 'old_cache'
	}else if(cacheState[waveId] == 2){
		return 'fresh_cache';
	}
}



//File: js/opt.js


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



//File: js/blip.js


function userList(users, expanded){ //because participant is a long word
  var USER_CUTOFF = small_screen?2:5;
  var span = document.createElement('span');
  if(users.length <= USER_CUTOFF || expanded){
    //todo: check if contributors are named robert<script>table.drop('students')</@googlewave.com
    
    span.innerHTML = users.join(", ")
          .replace(/antimatter15@googlewave.com/g,"<a href='http://antimatter15.com' target='_blank'>antimatter15</a>")
          .replace(/@.*?(\,|$)/g, "$1");
    if(expanded){
      var fewer = document.createElement('a');
      fewer.innerHTML = " (fewer)";
      fewer.href = "javascript:void(0)";
      fewer.onclick = function(){
        span.parentNode.replaceChild(userList(users), span);
        return false;
      }
      span.appendChild(fewer);
    }
  }else{
    span.innerHTML = users.slice(0,USER_CUTOFF).join(", ")
          .replace(/antimatter15@googlewave.com/g,"<a href='http://antimatter15.com'>antimatter15</a>")
          .replace(/@.*?(\,|$)/g, "$1");
    var more = document.createElement('a');
    more.innerHTML = " ... (" + (users.length-USER_CUTOFF) + " more)";
    more.href = "javascript:void(0)";
    more.onclick = function(){
      span.parentNode.replaceChild(userList(users, true), span);
      return false;
    }
    span.appendChild(more);
  }
  return span
}




function format_time(date){
  if(typeof date == "number"){
    var date2 = new Date();
    date2.setTime(date);
    date = date2;
  }
  var hr = date.getHours(), ampm = "am";
  if(hr > 12){ hr = hr - 12; ampm = "pm"}
  if(hr == 0){hr = 12}
  var minute = date.getMinutes().toString()
  if(minute.length == 1) minute = "0"+minute;
  return (date.getMonth()+1)+"/"+(date.getDate())+" "+hr+":"+minute+ampm;
}


function inline_blip_render(blipid){
  var doc = document.createElement("div");
  doc.className = "thread"
  blip_render(blipid, doc);
  return doc;
}

document.body.onclick = function(e){
	e = e || window.event;
	var osrc = (e.target||e.srcElement), src = osrc;
	if(osrc.tagName == 'A') return;
	
	while(src && !src.info && !src.blipId && src.tagName != 'HEAD'){
		src = src.parentNode;
	}
	
	if(!src){
		//meh
	}else if(src.info){
		e.cancelBubble = true;
    if(e.stopPropagation) e.stopPropagation();
    blip_next(src.blipId)
	}else if(src.blipId){
		e.cancelBubble = true;
    if(e.stopPropagation) e.stopPropagation();
    var info = msg.data.blips[src.blipId].info;
    info.parentNode.insertBefore(create_contextmenu(msg.data.blips[src.blipId]), info.nextSibling);
	}
}

function doNothing(){
	//well, i guess that's what I do
}

function blip_render(blipid, parent){ //a wrapper around renderBlip that adds chrome related things
  var blip = msg.data.blips[blipid];
  if(!blip || blip.dom) return; //already rendered, go on
  
  
  var doc = renderBlip(blip);
  msg.data.blips[blipid].dom = doc;
  doc.className = "message";
  doc.blipId = blipid;

  var info = document.createElement("div");
  info.className = "info";
	info.info = true;
	info.blipId = blipid;
	
  blip.info = info;

  var nextblip = '';
  if(chronological_blips[0] == blipid){
		if(chronological_blips.length == 1){
			nextblip = ' <span class="blipend">X</span>'
		}else{
			nextblip = ' <span class="blipend">&larr;</span>'
		}
	}else if(chronological_blips[chronological_blips.length-1] == blipid){
		nextblip = " <span class='blipstart'>&rarr;</span></div>"
	}else{
		nextblip = " <span class='nextarr'>&harr;</span></div>";
	}
  
  info.innerHTML = "<div style='float:right;color:#555'>"+format_time(blip.lastModifiedTime).toString()+nextblip;//<b>By</b> ";
  info.appendChild(userList(blip.contributors));
	
	
	try{
		doc.addEventListener("dragenter", function(e){
			e.stopPropagation();
			e.preventDefault();
		}, false);  
		doc.addEventListener("dragover", function(e){
			e.stopPropagation();
			e.preventDefault();
			loading('Drop file to upload! (Plz no big files)');
		}, false); 
		doc.addEventListener("dragend", function(e){
			e.stopPropagation();
			e.preventDefault();
			loading()
		}, false); 
		doc.addEventListener("drop", function(e){
			doc.style.backgroundColor = '';
			e.stopPropagation();
			e.preventDefault();
			var dt = e.dataTransfer;
			var files = dt.files;
			for(var i = 0; i < files.length; i++){
				var file = files[i];
				var reader = new FileReader();
				reader.onload = function(t){
					var data = t.target.result;
					if(/^data:.+;base64,/.test(data)){
						var b64 = data.substr(data.indexOf(',')+1);
						wave.blip.upload_attachment(b64, file.name, blipid, blip.waveId, blip.waveletId);
						loading('Uploading file '+file.name)
						runQueue();
					}else{
						console.log(data.substr(0,50))
						alert('data URL is not base64!')
					}
				}
				reader.readAsDataURL(file);
			}	
		}, false);
	}catch(err){
		console.log(err)
	}
	

	//iphone/opera doesnt trigger events unless there's an immediate handler. I think.
	doc.onclick = doNothing;
	info.onclick = doNothing

  doc.insertBefore(info, doc.firstChild);
  parent.appendChild(doc);
  
  if(blipid == chronological_blips[scrollto_position]){
    setTimeout(function(){
      blip_scroll(scrollto_position);
    },500);
  }
  
  return doc;
}



//File: js/createwave.js


function create_wave(){
	window._gaq && _gaq.push(['_trackEvent', 'Wave', 'Create wave']);
  var loadID = loading("Creating wave...")
  setTimeout(function(){
    var xcf = {};
    callbacks[wave.robot.createWavelet([], xcf)] = function(json){
      loading(loadID);
      setTimeout(function(){
        search_outdated = true;
        hashHandler('wave:'+json.data.waveId, true);runQueue();
      },100)
    }
    var title = 'New Wave';
    //wave.blip.insert(content, xcf.rootBlipId, xcf.waveId, xcf.waveletId);
    wave.wavelet.setTitle(title, xcf.waveId, xcf.waveletId)
    runQueue();
  },500)
}



//File: js/edit.js


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
  var submitted = false;
  submitbtn.onclick = function(){
    textbox.disabled = "disabled";
    submitbtn.disabled = 'disabled';
    if(!submitted){
      submitted = true;
      setTimeout(function(){
        submit_callback(textbox.value);
      },100);
    }
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
	/*
	if(!indented){
		info = ' Note the current version of the wave data API does not support creating continuations of a thread, thus all responses will be indented. Hopefully, this will be fixed shortly.'
		indented = true;
	}
	*/
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
    }/*
,
    "Attach Photo": function(){
			navigator.camera.getPicture(function(data){
				wave.blip.upload_attachment(data, 'new upload', current_blip.blipId, current_blip.waveId, current_blip.waveletId);
				loadWave(current_blip.waveId);
				runQueue();
			});
			closectx();
		},
		"Attach File": function(){
			wave.blip.upload_attachment(btoa('hello world'), 'helloworld.txt', current_blip.blipId, current_blip.waveId, current_blip.waveletId);
			loadWave(current_blip.waveId);
			runQueue();
			closectx();
		}//*/
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




//File: js/gadgets.js


//the majority of this is from the google splash project


function registerRpc(service, handler) {
  gadgets.rpc.register(service, function() {
    var service = this['s'];
    var gadgetId = this['f'];
    var args = this['a'];
    handler(service, gadgetId, args);
  });
}

function init_gadget_handler(callback){
  if(!window.gadgets){
    var frame_id = 'gadget_frame'+Math.random().toString(36).substr(4);
    var js = document.createElement("script");
    js.src = 'https://wave.google.com/gadgets/js/core:rpc?debug=1&c=1';
    (function(){
      if(window.gadgets){
        initGadgetSystem();
        callback();
      }else setTimeout(arguments.callee, 100);
    })()
    document.body.appendChild(js);
  }else{
    callback()
  }
}

function extractGadgetState(gadgetId) {	
	var DEFAULT_GADGET_MODE = {'${playback}': '0', '${edit}': '1'};

  console.log(gadgetId)
  var participants = gstates[gadgetId].participants;
  var state = gstates[gadgetId].state;

  // TODO: Enable gadget updates.
  gadgets.rpc.call(gadgetId, "wave_gadget_mode", null, DEFAULT_GADGET_MODE);
  gadgets.rpc.call(gadgetId, "wave_participants", null, participants);
  gadgets.rpc.call(gadgetId, "wave_gadget_state", null, state);
  // TODO: Deliver the real private state to the gadgets.
  gadgets.rpc.call(gadgetId, "wave_private_gadget_state", null, {});

}

function initGadgetSystem() {
  // Once a gadget has called us back, we can inject the state/participants.
  var REMOTE_RPC_RELAY_URL =
    "http://www.gmodules.com/gadgets/files/container/rpc_relay.html";

  
  registerRpc("wave_enable", function(service, gadgetId, args) {
    gadgets.rpc.setRelayUrl(gadgetId, REMOTE_RPC_RELAY_URL);
    extractGadgetState(gadgetId);
  });

  registerRpc("resize_iframe", function(service, gadgetId, args) {
    getEl(gadgetId).height = args[0]
  });

  gadgets.rpc.registerDefault(function() {
    var eventType = this['s'];
    var eventObj = this['a'][0];
    var gadgetId = this['f'];
    console.log(this);
    if(eventType == 'wave_gadget_state'){
      console.log('updating state');
      for(var i in eventObj){
        gstates[gadgetId].state[i] = eventObj[i]; //apply the delta
      }
      wave.blip.update_element(eventObj, gstates[gadgetId].blipId, current_wave, current_wavelet);
      runQueue();
      gadgets.rpc.call(gadgetId, "wave_gadget_state", null, gstates[gadgetId].state);
    }
    console.log(eventType,eventObj);
  });
}


function create_gadget_frame(id, gadget_url, container){
    var frameDiv = document.createElement('div');
    frameDiv.innerHTML = '<iframe name="' + id + '" >';
    var frame = frameDiv.firstChild;
    frame.id = id;
    frame.width = '320px';
    frame.height = '250px';
    frame.frameBorder = 'yes';
    frame.scrolling = 'no';
    frame.marginHeight = 0;
    frame.marginWidth = 0;
    // Create in specified div, or if none, in main body
    container = container || document.body;
    container.appendChild(frame);
    frame.src = gadget_url;
    return frame; 
}







function load_native_gadget(state, el, blip, container){
	
  var frame_id = 'gadget_frame'+Math.random().toString(36).substr(4);
	console.log(el);
	var participants = {
		myId: username,
		authorId: el.properties.author,
		participants: {}
	}

	for(var np = [], p = msg.data.waveletData.participants, l = p.length;l--;){
		participants.participants[p[l]] = {
			id:p[l], 
			displayName: p[l].replace(/@.*$/,''), 
			thumbnailUrl: 'https://wave.google.com/a/google.com/static/images/unknown.jpg'
		}
	}
					


	gstates[frame_id] = {state:state, participants:participants, blipId: blip.blipId}; //todo: clean up gstates
	if(opt.gsa){ //gadget state attack 2
		var url = 'http://anti15.chemicalservers.com/debugwave.xml';
	}else if(opt.gsa1){
		var url = 'http://anti15.chemicalservers.com/state.xml';
	}else{
		var url = el.properties.url;
	}


	var gadget_url = 'http://www.gmodules.com/gadgets/ifr?container=wave&view=default&debug=0&lang=en&country=ALL&nocache=0&wave=1&mid='+encodeURIComponent(frame_id)+'&parent='+encodeURIComponent(location.protocol+'//'+location.host+location.pathname)+'&url='+encodeURIComponent(url);

  init_gadget_handler(function(){
    create_gadget_frame(frame_id, gadget_url, container);
    console.log('creating '+frame_id+' for gadget '+url);
  })
}

function native_gadget(url, state){
  
}




function renderGadget(el, blip){
  var state = {}, keys = [];
  for(var prop in el.properties){
    if(prop != 'url' && prop != 'author')
      state[prop] = el.properties[prop];
      keys.push(prop);
  }
  var cont = document.createElement('div');
  cont.style.margin = '10px'
  var url = el.properties.url;
  cont.innerHTML = '<b>gadget</b> '+url+' <br>';
  if(window.opt.gadgets){
    load_native_gadget(state, el, blip, cont);
    return cont;
  }
  if(url == 'http://wave-api.appspot.com/public/gadgets/areyouin/gadget.xml'){
    var lists = {y:[],n:[],m:[]};
    for(var prop in state){
      if(/:answer$/.test(prop))
        lists[state[prop]].push(prop.substr(0, prop.length - 7));
    }
    for(var opt in lists){
      cont.innerHTML += "<br><span style='color:red;font-weight:bold'>"+({m:"Maybe",y:"Yes",n:"No"})[opt]+"</span><br> ";
      if(lists[opt].length == 0) cont.innerHTML += "(None) <br>";
      for(var k = 0; k < lists[opt].length; k++){
        cont.innerHTML += lists[opt][k].replace(/@googlewave.com/g, "") + ' <span style="color: gray;font-style: italic">'+(state[lists[opt][k]+":status"]||'') + "</span><br>";
      }
    }
  }else if(url == 'http://plus-one.appspot.com/plus-one.xml'){
    var sum = 0;
    for(var prop in state)
      sum += parseInt(state[prop]);
    cont.innerHTML += "<br><b>Votes:</b> " + sum + "/" + keys.length;
  }else if(url == 'http://www.elizabethsgadgets.appspot.com/public/gadget.xml'){
    cont.innerHTML += '<br> <b>Pluses</b> ('+(state.pluses||0)+')&nbsp;&nbsp;&nbsp;&nbsp;<b>Minuses</b> ('+(state.minuses||0)+')';
  }else if(url == 'http://pushyrobot.appspot.com/gadgets/github.xml'){
    cont.innerHTML += '<pre>'+JSON.stringify(JSON.parse(unescape(state.commit)),null,2)+'</pre>'
  }else if(url == 'http://everybodywave.appspot.com/gadget/image/gadget.xml'){
    cont.innerHTML += '<img src="'+state.imgUrl+'" width="'+state.imgWidth+'" height="'+state.imgHeight+'">';
  }else if(url == 'http://wavepollo.appspot.com/wavepollo/com.appspot.wavepollo.client.PolloWaveGadget.gadget.xml'){
    var items = {};
    for(var i in state){
      if(i.indexOf('MVOTE_') == 0){
        var parts = i.match(/MVOTE_(.+)(OPT_.+)$/);
        if(parts){
          if(!items[parts[2]]) items[parts[2]] = [];
          items[parts[2]].push(parts[1]);
        }
      }
    }
    for(var i in items){
      cont.innerHTML += "<br><span style='color:red;font-weight:bold'>"+state[i]+"</span> ("+items[i].length+")<br> ";
      for(var k = 0; k < items[i].length; k++){
        cont.innerHTML += items[i][k].replace(/@googlewave.com/g, "") + ', ';
      }
    }
  }else if(url == 'https://statusee.appspot.com/gadget/statusee.xml'){
    var v = ({notstarted:'Not started', describing: 'Describing', brainstorming: 'Brainstorming', inprogress: 'In Progress',
              inreview: 'In Review', pending: 'Pending', testing: 'Testing', completed: 'Completed', rejected: 'Rejected',
              'canceled': 'Canceled'})[state.sel];
    cont.innerHTML += "<b>Status</b> " + (v||state.sel.substr(7));
  }else if(url == 'http://wave-poll.googlecode.com/svn/trunk/src/poll.xml'){
    for(var i in state){
      var p = JSON.parse(state[i]).participants;
      cont.innerHTML += "<br><span style='color:red;font-weight:bold'>"+i.substr(7)+"</span> ("+p.length+")<br> ";
      for(var k = 0; k < p.length; k++){
        cont.innerHTML += p[k].replace(/@googlewave.com/g, "") + ', ';
      }
    }
  }else if(url == 'https://everybodywave.appspot.com/gadget/miniroster/main.xml'){
    cont.innerHTML += "<br><span style='color:red;font-weight:bold'>Assigned</span> ("+keys.length+")<br> ";
    for(var i in state){
      cont.innerHTML += i.split('~')[3] + ', ';
    }
  }else if(url == 'http://www.nebweb.com.au/wave/likey.xml'){
    cont.innerHTML += '<br> <b>Like</b> ('+(state.likeCount||0)+')&nbsp;&nbsp;&nbsp;&nbsp;<b>Dislike</b> ('+(state.dislikeCount||0)+')';
  }else if(window.opt.render_state || JSON.stringify(state).length < 1337){
    console.log("Unknown Gadget",url);
    var el = document.createTextNode(JSON.stringify(state,null,2)), pel = document.createElement('div');
    pel.appendChild(el);
    cont.innerHTML += '<div class="monospace">'+pel.innerHTML+'</div>'
  }
  return cont
}



//File: js/messages.js


function loading(text, nodelay){ 
  //we need to adjust for the possibility that the load is cancelled before it's actually loaded
	var load = getEl("loading");
	var has_opacity = typeof document.createElement('div').style.opacity != 'undefined';
	load.style.top = scrollY+'px';
	if(typeof text == "number" || text === false){
    if(has_opacity)
			load.style.opacity = "0";
		else
			load.style.display = "none";
		delete loadIds[text];
    setTimeout(function(){
      load.style.display = 'none';
    },500)
  }else{
    var id = Math.random()*42;
    loadIds[id] = true;
		setTimeout(function(){
		  load.style.top = scrollY+'px';
      if(loadIds[id]){
				load.style.display = "";
        if(has_opacity)
					load.style.opacity = "1";

        getEl("loadingtext").innerHTML = "<b>Loading</b> "+text;
      }

    }, nodelay?0:0); //it's unnerving when things flash, so only show after a wait
    return id;
  }
}


function error(text){
	var e = getEl('error');
	e.style.display = '';
	getEl('errortext').innerHTML += '<div><b>Error:</b> '+text+'</div>';
	e.onclick = function(){
		e.style.display = 'none';
		getEl('errortext').innerHTML = '';
	}
}



//File: js/nav.js


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




//File: js/ops.js


username = 'wheisenberg@googlewave.com';

//TODO: move this into wave.robot.getUserAddress
function getUsername(){
  //ROFLMAO this is an EPIC HACK
  callbacks[wave.robot.fetchWave('googlewave.com!w+bWEBb5mBA', //wave that nobody can read
                                 'googlewave.com!conv+poop') //just be a little more certain
                                 ] = function(json){
    username = json.error.message.match(/internalError: (.+@.+) is not a participant/)[1]
    return true //trigger to not get user to see message of user
  };
}

function clean_text(text){
	return text.replace(/[\0-\x09\x0b-\x1f\x7f\x80-\x9f\u2028\u2029\ufff9\ufffa\ufffb\u200e\u200f\u202a-\u202e]/g,'');
}

wave = {
  robot:{
    fetchWave: function(waveId, waveletId){
      return queueOp('wave.robot.fetchWave',{waveId: waveId, waveletId: waveletId})
    },
    "search": function(query, index, numResults){
      return queueOp('wave.robot.search', {query: query, index: index, numResults: numResults});
    },
    folderAction: function(modifyHow, waveId, waveletId){
      return queueOp('wave.robot.folderAction', {waveId: waveId, modifyHow: modifyHow, waveletId: waveletId});
    },
    notifyCapabilitiesHash: function(protocolVersion){
      var defaultVersion = (opt.use_protocol_21?0.21:0.22).toString();
      return queueOp('wave.robot.notifyCapabilitiesHash', {protocolVersion: protocolVersion||defaultVersion});
    },
    createWavelet: function(participants, preconf){ //awkkwurrdd!
      var rootBlipId = "TBD_"+waveletId+"_0x"+(Math.random()*9e5).toString(16);
      var wavehost = username.replace(/^.+@/,'');
      var waveletId = wavehost+"!conv+root";
      var waveId = wavehost+"!TBD_0x"+(Math.random()*9e5).toString(16);
      if(!preconf) preconf = {};
      preconf.waveId = waveId;
      preconf.waveletId = waveletId;
      preconf.rootBlipId = rootBlipId;
      return queueOp("wave.robot.createWavelet", {
             "waveletId": waveletId, 
             "waveletData": {
                "waveletId": waveletId, 
                "waveId": waveId, 
                "rootBlipId": rootBlipId, 
                "participants": participants
              }, 
              "waveId": waveId
              });
    }
    
  },
  wavelet:{
    appendBlip: function(content, parent, waveId, waveletId){
      var wavehost = username.replace(/^.+@/,'');
      var blipId =  "TBD_"+wavehost+"!conv+root_0x"+(Math.random()*9e5).toString(16);
      return queueOp('wave.wavelet.appendBlip', {waveletId: waveletId, waveId: waveId, blipId:blipId, "blipData": {"waveletId": waveletId, "blipId": blipId, "waveId": waveId, "content": content, "parentBlipId": parent}, parentBlipId: parent})
      
    },
    modifyParticipantRole: function(participant, role, waveId, waveletId){
      return queueOp('wave.wavelet.modifyParticipantRole', {waveletId: waveletId, waveId: waveId, participantId: participant, participantRole: role})
    },
    removeTag: function(tag, waveId, waveletId){
      return queueOp('wave.wavelet.modifyTag', {waveletId: waveletId, waveId: waveId, name: tag, modifyHow: 'remove'});
    },
    addTag: function(tag, waveId, waveletId){
      return queueOp('wave.wavelet.modifyTag', {waveletId: waveletId, waveId: waveId, name: tag});
    },
    
    setTitle: function(title, waveId, waveletId){
      return queueOp('wave.wavelet.setTitle', {waveletId: waveletId, waveId: waveId, waveletTitle: title});
    },
    participant: {
      add: function(participant, waveId, waveletId){
        return queueOp('wave.wavelet.participant.add', {waveId: waveId, waveletId: waveletId, participantId: participant});
      }
    }
  },
  document:{
    appendMarkup: function(content, blipId, waveId, waveletId){
      return queueOp('wave.document.appendMarkup', {waveletId: waveletId, waveId: waveId, blipId: blipId, content: content})
    },
    modify: function(modifyAction, blipId, waveId, waveletId){
      return queueOp('wave.document.modify', {waveletId: waveletId, waveId: waveId, blipId: blipId, modifyAction: modifyAction})
    },
    modify_range: function(modifyAction, start, end,  blipId, waveId, waveletId){
      return queueOp('wave.document.modify', {waveletId: waveletId, waveId: waveId, blipId: blipId, modifyAction: modifyAction, range: {start: start, end: end}})
    }
  },
  blip:{
    "delete": function(blipId, waveId, waveletId){
      return queueOp('wave.blip.delete', {waveletId: waveletId, waveId: waveId, blipId: blipId})
    },
    //this is actually pretty different from others, it's just a shortcut for another one
    "replace": function(content, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify({modifyHow: "REPLACE", values: ['\n'+content]}, blipId, waveId, waveletId)
    },
    "replace_range": function(content, start, end, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify_range({modifyHow: "REPLACE", values: [content]}, start, end, blipId, waveId, waveletId)
    },
    "update_element": function(properties, blipId, waveId, waveletId){

      return queueOp('wave.document.modify', {
        waveletId: waveletId, 
        waveId: waveId, 
        blipId: blipId, 
        modifyAction: {
          'modifyHow': 'UPDATE_ELEMENT',
          elements: [
            {'type': 'GADGET',
            properties: properties}
          ]
        },
        modifyQuery: {
          restrictions: {},
          maxRes: 1,
          elementMatch: "GADGET"
        }
      })
    },
    
    "upload_attachment": function(contents, caption, blipId, waveId, waveletId){
			return queueOp('wave.document.modify', {
				"blipId": blipId, 
				"waveletId": waveletId, 
				"waveId": waveId, 
				"modifyAction": 
					{
						"modifyHow": "INSERT_AFTER", 
						"elements": [{
							"type": "ATTACHMENT", 
							"properties":  {
								"caption": caption, 
								"data": contents + "\n"
							}
						}]
					}
				})
		},
    "insert": function(content, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify({modifyHow: "INSERT", values: ['\n'+content]}, blipId, waveId, waveletId)
    },
    "append": function(content, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify({modifyHow: "INSERT_AFTER", values: [content]}, blipId, waveId, waveletId)
    },

    createChild: function(parentBlipId, waveId, waveletId, blipId){
      return queueOp('wave.blip.createChild', {
        "waveletId": waveletId, "waveId": waveId, blipId: parentBlipId, 
        "blipData": {"waveletId": waveletId, "blipId": blipId, "waveId": waveId, "content": '', "parentBlipId": parentBlipId}
      })
    },
    continueThread: function(parentBlipId, waveId, waveletId, blipId){
      return queueOp('wave.blip.continueThread', {
        "waveletId": waveletId, "waveId": waveId, blipId: parentBlipId, 
        "blipData": {"waveletId": waveletId, "blipId": blipId, "waveId": waveId, "content": '', "parentBlipId": parentBlipId}
      })
    },
    contentCreateChild: function(content, parentBlipId, waveId, waveletId){
      var blipId = "TBD_"+waveletId+"_0x"+(Math.random()*9e5).toString(16);
      wave.blip.createChild(parentBlipId, waveId, waveletId, blipId);
      wave.blip.replace(content, blipId, waveId, waveletId);
    },
    contentContinueThread: function(content, parentBlipId, waveId, waveletId){
      var blipId = "TBD_"+waveletId+"_0x"+(Math.random()*9e5).toString(16);
      wave.blip.continueThread(parentBlipId, waveId, waveletId, blipId);
      wave.blip.replace(content, blipId, waveId, waveletId);
    }
  }
}




//File: js/ordering.js


function chronological_blip_render(parent){
  var blips = []
  for(var blip in msg.data.blips){
    blips.push(msg.data.blips[blip])
  }
  blips = blips.sort(function(a, b){
    return a.lastModifiedTime - b.lastModifiedTime
  })
  
  var singleBlip = function(i){
    var doc = blip_render(blips[i].blipId, parent);
    if(msg.data.blips[blips[i].parentBlipId] && doc){
      var blockquote = document.createElement("blockquote");
      var markup = msg.data.blips[blips[i].parentBlipId];
      var ht = markup.contributors.join(", ").replace(/@googlewave.com/g, "") + ":" + markup.content;
      blockquote.innerHTML = ht.substr(0,140) + (ht.length > 140?"...":"");
      blockquote.setAttribute("onclick", "msg.data.blips['"+markup.blipId+"'].dom.scrollIntoView()")
      doc.insertBefore(blockquote,doc.getElementsByTagName("div")[0].nextSibling)
      
    }
  }
  
  //for(var i = blips.length; i--;)singleBlip(i);
  var i = blips.length-1;
  (function(){
    var ii = Math.max(0, i-10);
    //console.log(i,blips[i]);
    for(;i >= ii; i--) singleBlip(i);
    
    if(ii) setTimeout(arguments.callee, 0);
  })()
}


function recursive_blip_render(blipid, parent){
  var doc = blip_render(blipid, parent);
  var blip = msg.data.blips[blipid];
  if(blip.childBlipIds.length > 0){
    if(blip.childBlipIds.length > 1){
      var thread = document.createElement("div");
      thread.className = "thread";
      for(var i = 1; i < blip.childBlipIds.length; i++){
        var child = recursive_blip_render(blip.childBlipIds[i], thread); //render children
      }
      if(thread.childNodes.length != 0)
        parent.appendChild(thread);
    }
    var child = recursive_blip_render(blip.childBlipIds[0], parent); //render children
  }
  return doc;
}

function bootstrap_thread_render(parent){
  var thread = msg.data.waveletData.rootThread;
  var children = thread.blipIds, clen = children.length, c = 0;
  
  var i = 0;
  (function(){
    var endlen = i+5;
    for(;i<endlen&&i<clen;)
      thread_render(children[i++], parent);
    
    if(i < clen) setTimeout(arguments.callee, 0);
  })()
  
  /*
  for(var children = thread.blipIds, clen = children.length, c = 0; c < clen; c++){
    var childid = children[c]; //These are root-level blips
    thread_render(childid, parent); 
  }
  */
}

function thread_render(blipid, parent){
  var blip = msg.data.blips[blipid];
	if(!blip) return;
  if(blip.dom) return;
  var doc = blip_render(blipid, parent); //render the blip and attach it to the current "parent" (including header and content)
  

  
  var threads = blip.replyThreadIds,  //get a list of threads which are children of the blip
      tlen = threads.length;

  if(tlen != 0){
    var threadel = document.createElement("div");
    threadel.className = "thread"; //the little dropshadow
    parent.appendChild(threadel);
    
    for(var t = 0; t < tlen; t++){
      var threadid = threads[t];
      var thread = msg.data.threads[threadid]; //get a reference to the specific thread
      for(var children = thread.blipIds, clen = children.length, c = 0; c < clen; c++){
        var childid = children[c];
        thread_render(childid, threadel); //recursively render each blip
      }
    }
  }
  return doc;
}



//File: js/render.js


function renderImage(src, cont){
	var img = document.createElement('img');
	img.style.display = 'none';
	img.src = src;
	(function(img){
		img.onload = function(){
			var width = screen_size;
			try{
				width = parseInt(getComputedStyle(document.documentElement, 
					cont).width);
			}catch(e){width = screen_size };
			if(img.width > width - 21){
				img.style.width = "100%";
				img.onclick = function(){
					if(img.style.width.indexOf('%') == -1){
						img.style.width = "100%";
					}else{
						img.style.width = "";
					}
				}
			}
			img.style.display = '';
		}
	})(img);
	cont.appendChild(img);
}


function renderBlip(markup){
  var content = markup.content + ' '; //render an extra space at the end for rendering the user cursor annotations
  var annotation_starts = {}, annotation_ends = {};
  var user_colors = {};
  for(var i = 0; i < markup.annotations.length; i++){
    //iterate and note where the annotations end and start
    var note = markup.annotations[i];
    
    if(note.name.indexOf('user/d/') == 0){
      var user_session = note.value.split(',');
      var userid = note.name.substr(7);
      if(new Date - parseInt(user_session[1]) < 1000 * 60){ //expire after one minute
        user_colors[userid] = 'rgb(' +
                Math.floor(205-Math.random()*100).toString()+',' +
                Math.floor(205-Math.random()*100).toString()+',' +
                Math.floor(205-Math.random()*100).toString()+')';
      }
    }
    if(!annotation_starts[note.range.start]) 
      annotation_starts[note.range.start] = [i]
    else annotation_starts[note.range.start].push(i);
    if(!annotation_ends[note.range.end]) 
      annotation_ends[note.range.end] = [i]
    else annotation_ends[note.range.end].push(i);
  }
  var notes = {};
  var doc = document.createElement('div'), line = null, section = null;
  var htmlbuffer = '';
  for(var i = 0; i < content.length; i++){
    if(annotation_starts[i] || annotation_ends[i] || markup.elements[i]){
      if(htmlbuffer) section.appendChild(document.createTextNode(htmlbuffer));
  
      htmlbuffer = '';
      if(markup.elements[i]){
        //define new superelement and span
        var el = markup.elements[i];

        if(el.type == "INLINE_BLIP"){
          //var cont = document.createElement('div');
          //cont.style.border = "3px dotted blue";
          //cont.style.margin = '10px'
          //cont.innerHTML = '&lt;<b>inline</b> blip '+el.properties.id+'&gt;';
          //doc.appendChild(cont);
          
          doc.appendChild(inline_blip_render(el.properties.id));
        }else if(el.type == "IMAGE"){
          //this is actually something which shouldn't happen, it means that ur capabilities arent up to date
          var cont = document.createElement('div');
          //cont.style.border = "3px dotted orange";
          //cont.style.margin = '10px'
          //cont.innerHTML = '&lt;<b>Wave 1.0 Attachment</b> '+el.properties.attachmentId+' '+el.properties.caption+'&gt;';
          cont.innerHTML = '<b>'+(el.properties.attachmentId||'')+'</b> '+(el.properties.caption||'')+'<br>';
          if(el.properties.url){
            renderImage(el.properties.url, cont);
          }
          doc.appendChild(cont);
        }else if(el.type == "INSTALLER"){
          //this is actually something which shouldn't happen, it means that ur capabilities arent up to date
          var cont = document.createElement('div');
          cont.style.border = "3px dotted orange";
          cont.style.margin = '10px'
          cont.innerHTML = '&lt;<b>Extension Installer</b> '+el.properties.manifest+'&gt;';
          
          doc.appendChild(cont);
        }else if(el.type == "ATTACHMENT"){
          var cont = document.createElement('div');
          cont.style.margin = '10px'
          cont.innerHTML = '<b>'+el.properties.mimeType+'</b> '+el.properties.caption+'<br>';
          if(el.properties.mimeType && el.properties.mimeType.indexOf('image/') == 0){
						renderImage(el.properties.attachmentUrl, cont)
            
          }else{
            cont.innerHTML += "<a href='"+el.properties.attachmentUrl+"'>Download</a>"
          }
          doc.appendChild(cont);
        }else if(el.type == "GADGET"){
         
          doc.appendChild(renderGadget(el, markup));
        }else if(el.type != "LINE"){
          console.log('unknown element type', el.type, el.properties)
        }
        //implicitly create a new element anyway
        //if(el.type == "LINE"){
          line = document.createElement(el.properties.lineType || "p");
          if(el.properties.indent)
            line.style.marginLeft = el.properties.indent * 20 + 'px';
          if(el.properties.alignment)
            line.style.textAlign = ({l: 'left', c: 'center', r: 'right'})[el.properties.alignment];          
          if(el.properties.direction)
            line.setAttribute('dir',({l: 'ltr', r: 'rtl'})[el.properties.alignment]);
          doc.appendChild(line);
        //}
      }

      
      if(annotation_starts[i]){
        //add to the styles list/create new blah
        for(var k = annotation_starts[i], l = k.length; l--;){
          var note = markup.annotations[k[l]];
          if(!notes[note.name]) notes[note.name] = [];
          notes[note.name].push(note.value);
          
          if(note.name.indexOf('user/e/') == 0){
            var userid = note.name.substr(7);
            if(user_colors[userid]){
              var cursor = document.createElement('span');
              cursor.className = 'cursor';
              cursor.innerHTML = note.value.replace(/@.+/,'');
              cursor.style.backgroundColor = user_colors[userid];
              section.appendChild(cursor)
            }
          }
        }
      }
      if(annotation_ends[i]){
        //add to styles list/create new blah
        for(var k = annotation_ends[i], l = k.length; l--;){
          var note = markup.annotations[k[l]];
          notes[note.name].shift()
          if(notes[note.name].length == 0){
            delete notes[note.name];
          }
        }      
      }
      //create new span
      if(notes['link/auto'] || notes['link/manual'] || notes['link/wave']){ //probably needs some rewriting
        section = document.createElement('a');
      }else  section = document.createElement('span');
      line.appendChild(section);
      //apply the styles to the new span
      for(var note in notes){
        //if(notes[note].length == 0) continue;
        var val = notes[note][0];
        if(note.indexOf("style/") == 0){
          section.style[note.substr(6)] = val;
        }else if(note == "conv/title"){
          section.style.fontWeight = 'bold';
        }else if(note == 'spell'){
          //section.style.borderBottom = '1px solid #C00';
        }else if(note == 'lang'){
          //section.title = "Language: "+val;
        }else if(note == 'link/manual' || note == 'link/auto'){
					//handle waveid links
					if(/^waveid:\/\//.test(val)){
						section.href = '#wave:'+val.substr(9);
						section.setAttribute('onclick', 'ch(this)')
						//https://wave.google.com/wave/#restored:wave:googlewave.com%252Fw%252B7mNEVnmbA
					}else if(/wave:(.+?)(\,$)/.test(val)){
						section.href = '#wave:'+val.match(/wave:(.+?)(\,$)/)[1];
						section.setAttribute('onclick', 'ch(this)')
					}else{
          	section.href = val;
	          section.target = "_blank"
					}
        }else if(note == 'link/wave'){
          section.href = '#wave:'+val;
          section.setAttribute('onclick', 'ch(this)')
          
        }else if(note.indexOf("user/e") == 0){
          //ignore (parsed elsewhere)
        }else if(note.indexOf("user/d") == 0){
          //ignore
        }else if(note.indexOf("user/r") == 0){
          //ignore
        }else{
          console.log('unrecognized annotation', note, val);
        }
      }
    }
    if(content.charAt(i) != "\n")
      htmlbuffer += content.charAt(i);
    
  }
  if(htmlbuffer) section.appendChild(document.createTextNode(htmlbuffer));
  return doc;
}



//File: js/rpc.js


var queue = [];
var callbacks = {};
var id_count = 0;

if(!window.logoff){
	logoff = function(){
		if(confirm("Are you sure you want to log off?")){
			var xhr = new(window.ActiveXObject||XMLHttpRequest)('Microsoft.XMLHTTP');
			xhr.open('GET', '/logout', true);
			xhr.onreadystatechange = function(){
				if(xhr.readyState == 4){
					logoff_ui();
				}
			}
			xhr.send(null);
		}
	}
}

function logoff_ui(){
  loading(false);
	getEl('login').style.display = '';
	getEl('appheader').style.display = 'none';
	getEl('content').style.display = 'none';
}

function logon_ui(){
  loading(false);
	getEl('login').style.display = 'none';
	getEl('appheader').style.display = '';
	getEl('content').style.display = '';
}

function queueOp(method, params, callback){
  var id = (id_count++).toString();
  if(callback) callbacks[id] = callback;
  queue.push({
      id: id,
      method: method,
      params: params
    });
  return id;
}

//prepahrering fur moobilz klientz
if(!window.doXHR){
  window.doXHR = function(postdata, callback){
    //stolen shamelessly from the never-ending awesomeness of vxjs
    var xhr = new(window.ActiveXObject||XMLHttpRequest)('Microsoft.XMLHTTP');
    xhr.open('POST', '/rpc', true);
    xhr.setRequestHeader("Content-Type", "application/json"); 
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4){
        callback(xhr);
      }
    }
    xhr.send(postdata);
  }
}



function runQueue(){
  if(queue.length == 0) return false;
  for(var ids = [], i = 0; i < queue.length; i++)
    ids.push(queue[i].id);
  
  doXHR(JSON.stringify(queue), function(xhr){
    if(xhr.status == 200){
      var json;
      try{
        json = JSON.parse(xhr.responseText);
      }catch(err){
        
				if(xhr.responseText.indexOf("Error 401") != -1){
          return logoff_ui();
        }
          for(var i = 0; i < ids.length; i++){
          var cb_result = null;
          var id = ids[i];
          if(callbacks[id]){
            try{
              cb_result = callbacks[id]();
            }catch(err){}
            delete callbacks[id];
          }
          if(!cb_result){
            //alert('There was a server error, please try again. A');
            //if(xhr.responseText)alert(xhr.responseText);
						console.log('Server Error: Could not parse as JSON', xhr.responseText)
						error('JSON not parseable.');
          }
          }
      }
      if(json){
        //no error yay
        console.log(json)
        for(var i = 0; i < json.length; i++){
          //run each callback.
          var id = json[i].id;
          var cb_result = null;
          if(callbacks[id]){
            cb_result = callbacks[id](json[i]);
            delete callbacks[id];
          }
          if(json[i].error && !cb_result){
            if(json[i].error.code == 401){
              return logoff_ui()
              //alert('Your login token has expired\n'+xhr.responseText)
              //return location = '/?force_auth=true';
            }
            console.log("Error "+json[i].error.code+": "+json[i].error.message);
						error(json[i].error.message)
          }
        }
      }
    }else{
      for(var i = 0; i < ids.length; i++){
        var cb_result = null;
        var id = ids[i];
        if(callbacks[id]){
          try{
            cb_result = callbacks[id]();
          }catch(err){}
          delete callbacks[id];
        }
        if(!cb_result){
          console.log('Server Error: Error not caught.', xhr.status);
					error("No data was returned in the server response.")
        }
      }
    }
  })
  queue = [];
}




//File: js/search.js


function autosearchbox(){
  var query = document.forms.searchbox.query.value;
  if(query.toLowerCase().indexOf("wave:") == 0 || query.toLowerCase().indexOf("new:") == 0){
    hashHandler("#"+query, true);
  }else{
    hashHandler("#search:"+query, true);
  }
}


function autosearch(query){
  if(query == current_search && current_page == 1 && search_outdated == false && !opt.multipane){
    getEl('suggest').style.display = '';
    searchmode(0);
    current_page = 0;
    search_container.style.display = '';
    if(!opt.no_scrollhistory && !opt.multipane){
      scroll_searchpanel(searchscroll)
    }
    if(!opt.multipane){
      wave_container.style.display = 'none';
      if(!opt.multipane) msg = {};
      wave_container.innerHTML = '';
    }
  }else{  
    current_search = document.forms.searchbox.query.value = query;
    update_search();
  }
  if(!opt.multipane) getEl('floating_menu').style.display = 'none';
}

function searchmode(mode){
  //return //it appears most computers cant do it
  //change the little back button icon in ways which iPhone cant do
  
  //if(mobilewebkit) return;
  //getEl("search_go").style.display = mode?"none":"";
  //getEl("search_back").style.display = mode?"":"none";
}





function set_user_mode(mode){
  var wavehost = username.replace(/^.+@/,'');
  msg.data.waveletData.participants.slice(1).forEach(function(i){ //not creator
    wave.wavelet.modifyParticipantRole(i,mode||'READ_ONLY', current_wave, msg.data.waveletData.waveletId);
    alert('done setting '+(msg.data.waveletData.participants.length -1) + ' people as '+(mode||'READ_ONLY'));
  }); 
  runQueue()
}



function add_tag(){
  var tag = prompt('Add tag');
  if(tag){
    wave.wavelet.addTag(tag, msg.data.waveletData.waveId, msg.data.waveletData.waveletId);
    loadWave(msg.data.waveletData.waveId);
    auto_reload = true;
    runQueue();
  }
}



function update_search(startIndex){
  current_page  = 0;
  var loadId = loading(current_search);
  if(!opt.multipane) msg = {};
  
  extend_search(0, function(){
    loading(loadId);
    getEl('suggest').style.display = '';
    search_container.innerHTML = '';
    searchmode(0);
    search_container.style.display = '';
    if(!opt.multipane){
      wave_container.style.display = 'none';
      wave_container.innerHTML = '';
    }
  });
}

function auto_extend(bar){
  bar.innerHTML = "Loading..."
  extend_search(searchLastIndex + 42, function(){
    bar.parentNode.removeChild(bar);
  });
  runQueue();
}




if(!window.resultClass){
	window.resultClass =function(waveId){
		return ''
	}
}

function extend_search(startIndex, callback){
  searchLastIndex = startIndex;
  search_outdated = false;
  window._gaq && _gaq.push(['_trackEvent', 'Search', 'Load Search Page', current_search]);
  var search_callback = function(data){
    if(callback)callback();
    //msg = data; //globalization is bad
    console.log(data);
    var shtml = '';
    var item, digests = data.data.searchResults.digests;
    if(opt.prefetch && onLine() == true){
      var itemIndex = 0;
      setTimeout(function(){
        var item = digests[itemIndex++];
        if(item){
          var  waveletId = item.waveId.replace(/[\/!].+/,'!conv+root');
          callbacks[wave.robot.fetchWave(item.waveId, waveletId)] = function(d){
            if(d){
              prefetched_waves[item.waveId] = d;
            }
            return true;
          }
          runQueue();
          setTimeout(arguments.callee, 500);
        }
      },1000)
    }
    for(var i = 0; i < digests.length; i++){
      item = digests[i];
      item.title = item.title.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
      item.snippet = item.snippet.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
      unread_blips[item.waveId] = item.unreadCount;
      
      if(opt.old_results){
        shtml += '<a href="#wave:'+item.waveId+'" class="searchlink" onclick=\'ch(this)\'><div class="search"><b>' + item.title+"</b> <span style='color:gray'>"+ item.snippet +"</div></a>";
      }else{
        var msg = item.unreadCount>0?("<span class='unread_msg'><span class='bubble'>"+item.unreadCount+"</span> of "+item.blipCount+"</span>")
        :("<span class='read_msg'>"+item.blipCount+" msgs</span>");
        
        var time = format_time(item.lastModified);
				var cache = opt.offline?' <span class="cachestate">cache</span>':'';
        var content = '<div id="'+item.waveId+'" class="search '+resultClass(item.waveId)+'">'+
						'<div class="date">'+time+'<br>'+msg+cache+'</div><span class="title_'+(item.unreadCount > 0 ? "unread": "read")+
						'">' + item.title+"</span> <span class='snippet'>"+ item.snippet +"</span> </div>";
				shtml += '<a href="#wave:'+item.waveId+'" class="searchlink" onclick=\'ch(this)\'>'+content+'</a>';
      }
    }
    search_container.innerHTML += shtml;
    if(onLine() == false){
      search_container.innerHTML += '<div class="footer"><b>Sorry!</b> No further waves have been cached.</div>';
    }else if(digests.length < 42){
      if(digests.length == 0){
        if(current_search.indexOf("is:unread") != -1){
          search_container.innerHTML += "<div class='footer'><b>Yay</b>, no unread items!</div>"
        }else{
          search_container.innerHTML += "<div class='footer'>Your search query has <b>zero results</b>. Try broaden your search?</div>"
        }
      }else{
        search_container.innerHTML += "<div class='footer'><b>Hooray!</b> You've reached the end of the universe!</div>"
      }
    }else{
      search_container.innerHTML += '<div class="footer" onclick="auto_extend(this);"><b>Extend</b> Search (Page '+((startIndex/42)+1)+')</div>';
    }
    
  };
  if(onLine() == true){
		callbacks[wave.robot.search(current_search,startIndex||0,42)] = search_callback;
	}else{
		//offline stuff!
		open_db();
		if(!window.db) return console.log('no database');
		db.transaction(function (tx) {
			tx.executeSql('SELECT * FROM inbox', [], function (tx, results) {
				var r = [];
				for(var i = 0; i < results.rows.length; i++){
					r.push(JSON.parse(results.rows.item(i).result));
				}
				search_callback({
					data: {
						searchResults: {
							digests: r
						}
					}
				})
			});
		});
	}
}



//File: js/url.js


//ch(this) is short for clickhandler which fixes some problems with opera mini and speeds up iphone 
//or at least  user agents which don't support window.onhashchange so we dont need to poll, but we poll anyway
//to detect history changes, but whatever.
function ch(el){ 
  hashHandler(el.href.substr(el.href.indexOf("#")), true);
}



//hash change doesnt actually mean anything, it just means another check
function hashHandler(hash, forcechange){
  var last = lasthash;
  lasthash = hash;
  //TODO: totally rewrite this mess. BUT: it works okay, so hmm.
  if(hash.charAt(0) == "#") hash = unescape(hash.substr(1));
  if(unescape('#'+hash) == unescape(last) && !forcechange) return;
  if(unescape(unescape(unescape(location.hash))) != "#"+unescape(unescape(unescape(hash)))){
    location.hash = "#"+unescape(unescape(hash));
  }
  if(hash.indexOf("search:") == 0){
    autosearch(hash.substr(7))
    runQueue();
  }else if(hash.indexOf("wave:") == 0){
    loadWave(hash.substr(5))
    runQueue();
  }else if(hash.toLowerCase().indexOf("new:wave") == 0){
    create_wave();
  }else{
    //idk
  }
}


if(typeof window.onhashchange == "undefined"){
  setInterval(function(){
    window.onhashchange();
  },100)
}

window.onhashchange = function(){  
  hashHandler(location.hash);
}



//File: js/wave.js


var chronological_blips = [];
function loadWave(waveId, waveletId){  
  var loadId = loading(waveId);
  //if(onLine() == false) return window.offline_loadWave(waveId);
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
    try{
  		window._gaq && _gaq.push(['_trackEvent', 'Wave', 'Load Wave', waveContent.data.waveletData.title]);
		}catch(err){}
    loading(loadId);
    console.log(waveContent);
    if(waveContent.error){
      if(waveContent.error.message.indexOf('not a participant') != -1){
        alert('You are not a participant of the wave/wavelet. '+
        '\nThis may be due to a bug in the current version of the data api which does not allow acces'+
        's to waves unless you are explicitly a participant. don\'t blame me');
        return true;
      }else{
        return false;
      }
    }
    
    if(!waveContent.data.waveletData){
      error('The server sent nothing')
      return;
    }



    window.msg = waveContent;
    searchmode(1);
    
    if(!opt.multipane){
      search_container.style.display = 'none';
    }
    
    current_page = 1;

    wave_container.style.display = '';
    update_scroll();
    getEl('floating_menu').style.display = '';
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
            scrollto_position = unread_blips[waveId]-1;
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
    if(!opt.multipane) getEl('suggest').style.display = 'none';
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
    add.href="javascript:void(0)";
    add.onclick = function(){
      var participant = prompt('Enter Participant ID to Add');
      window._gaq && _gaq.push(['_trackEvent', 'Modify', 'Add participant']);
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
    
    
    if(getEl("chronos").checked){
      chronological_blip_render(wavedata)
    }else{
      if(msg.data.waveletData.rootThread){
        bootstrap_thread_render(wavedata);
      }else{
        recursive_blip_render(msg.data.waveletData.rootBlipId, wavedata);
      }
    }
    var tags = document.createElement('div');
    var t = waveContent.data.waveletData.tags.join(', ');
    if(t.length == 0) t = "(No Tags)";
    tags.innerHTML = "<b>Tags:</b> "; //todo: fix xss risk
    tags.innerHTML = ' <a href="javascript:add_tag()" style="float:right">Add</a>';
    tags.appendChild(document.createTextNode(t))
    tags.className = 'tags';
    wave_container.appendChild(tags);
    var footer = document.createElement('div');
    footer.innerHTML = '<a href="https://wave.google.com/wave/#restored:wave:'+escape(escape(waveId))+'" target="_blank">Open this wave in the official wave client</a>';
    footer.className = 'footer';
    wave_container.appendChild(footer);
    if(opt.bigspace){
			var bigspace = document.createElement('div');
			bigspace.style.height = '250px';
			wave_container.appendChild(bigspace)
		}
  }
  if(onLine() == false){
		open_db();
		if(!window.db) return console.log('no database');
		db.transaction(function(tx){
			tx.executeSql('SELECT * FROM inbox WHERE waveid = ?', [waveId], function (tx, results) {
				var waveContent = JSON.parse(results.rows.item(0).data);
				load_callback(waveContent);
			})
		});
  }else if(opt.prefetch && prefetched_waves[waveId]){
    load_callback(JSON.parse(JSON.stringify(prefetched_waves[waveId])));
  }else{
    callbacks[wave.robot.fetchWave(waveId, waveletId)] = load_callback;
  }
}



//File: js/lib/json.js


/*
 * Most of the time the data is trusted and there's a native JSON.stringify
 * So really, having json2.js is overkill
 * Especially on mobile
 * */

if (!this.JSON) {
    this.JSON = {
				stringify: function(obj){
					var enc = JSON.stringify; // for purposes of recursion

					if (typeof obj == "boolean" || typeof obj == "number" || obj === null || typeof obj == 'undefined') {
						return obj + ''; // should work...
					} else if (typeof obj == "string") {
						// a large portion of this is stolen from Douglas Crockford's json2.js
						return '"' + obj
								.replace(
										/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
										function(a) {
											return '\\u' + ('0000' + a.charCodeAt(0).toString(
													16)).slice(-4);
										}) + '"'; // note that this isn't quite as purtyful as
													// the usualness
					} else if (obj.length) { // simple hackish test for arrayish-ness
						for ( var i = 0; i < obj.length; i++) {
							obj[i] = enc(obj[i]); // encode every sub-thingy on top
						}
						return "[" + obj.join(",") + "]";
					} else {
						var pairs = []; // pairs will be stored here
						for ( var k in obj) { // loop through thingys
							pairs.push(enc(k) + ":" + enc(obj[k])); // key: value
						}
						return "{" + pairs.join(",") + "}"; // wrap in the braces
					}
				},
				parse: function(text){
					return /*!(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(text.replace(/"(\\.|[^"\\])*"/g, ''))) &&*/ eval('(' + text + ')');
				}
		};
}



//File: js/startup.js


function startup(){
  if(onLine()){
		wave.robot.notifyCapabilitiesHash(); //switch to l83s7 v3rz10n
		getUsername(); //get the username of the user
		//TODO: something to pull username from cache if offline?
	}
	if(onLine() == false){
		document.body.className = document.body.className.replace('online', 'offline');
	}
  if(location.hash.length < 2){
    hashHandler('#search:in:inbox');
  }else{
    hashHandler(location.hash);
  }
	for(var i = endQueue.length; i--;){
		endQueue[i]();
	}
}

//yeah, okay, so i'm using the onload thing, sure that's 
//evil but i dont have a library and i'm not sure i know
//if window.addEventListener("DOMContentReady" or is it loaded)
//whatever, it's not x-platofrm though this doesn twork in ie anyway

function auto_start(){

  if(!window.NO_STARTUP){
    startup();
  }
  if(window.offline_cache && opt.offline && onLine()){
		setTimeout(offline_cache, 1337)
	}
	
}

auto_start(); //be a tad more agressive than
//setTimeout(auto_start,0)




