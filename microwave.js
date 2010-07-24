
if(!window.console) console = {log: function(){}};

var screen_size = (document.documentElement.clientWidth||innerWidth), small_screen = (screen_size<500);

var loadIds = {};
searchLastIndex = 0;
current_search = '';
var edit_box, edit_text;

var search_container = document.getElementById('search_container');
var wave_container = document.getElementById('wave_container');

opt.appName = '&mu;wave'

var mobilewebkit = navigator.userAgent.indexOf("WebKit") != -1 && navigator.userAgent.indexOf("Mobile")!=-1;
var current_wave = "";
var current_wavelet = "";
var auto_reload = false;
var lasthash = 'chunkybacon';
var current_page = 0; //0 = search, 1 = wave
var search_outdated = false;
var searchscroll = 0;
var scrollto_position = -1;


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


var lastscrolled = ""
function blip_scroll(index){
  try{
    msg.data.blips[lastscrolled].info.className = 'info';
  }catch(err){};
  lastscrolled = chronological_blips[index];
  if(msg.data.blips[chronological_blips[index]].dom){
    msg.data.blips[lastscrolled].info.className = 'info selected';
    msg.data.blips[chronological_blips[index]].dom.scrollIntoView(true);
    return true;
  }
  return false;
}

document.onscroll = window.onscroll = function(){
  if(current_page == 0){
    searchscroll = scrollY;
  }
  document.getElementById('floating_menu').style.top = (scrollY+window.innerHeight-40)+'px';
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


function loading(text, nodelay){ 
  //we need to adjust for the possibility that the load is cancelled before it's actually loaded
  if(typeof text == "number"){
    document.getElementById("loading").style.display = "none";
    delete loadIds[text];
  }else{
    var id = Math.random()*42;
    setTimeout(function(){
      if(loadIds[id]){
        document.getElementById("loading").style.display = "";
        document.getElementById("loadingtext").innerHTML = "<b>Loading</b> "+text;
      }
    }, nodelay?0:700); //it's unnerving when things flash, so only show after a wait
    loadIds[id] = true;
    return id;
  }
}

if(!window.onLine){
	window.onLine = function(){return true};
}

if(opt.multipane===undefined && screen_size > 900 && !mobilewebkit){
  opt.fn.set('multipane', true)
}


opt.x.multipane = 'Enable multipane viewing experience (note, you must reload the page for changes to take effect)'

if(mobilewebkit){
  document.body.className += ' mobilewebkit'; //yeah i know browser detection is bad, but how do i get around it here? 
}


if(opt.multipane) {
  document.getElementById('search_parent').insertBefore(document.getElementById('appheader'), document.getElementById('search_parent').firstChild)
  document.body.className += ' multipane';
  document.getElementById('header').innerHTML = '&mu;wave';
  wave_container.innerHTML = "<div style='padding:40px'>No waves loaded yet</div>";
  if(location.hash.indexOf('search:') == -1){
    setTimeout(function(){
      autosearch('in:inbox')
      runQueue();
    },500);
  }
}
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


function create_wave(){
  var loadID = loading("Creating wave...")
  setTimeout(function(){
    var xcf = {};
    callbacks[wave.robot.createWavelet([], xcf)] = function(json){
      loading(loadID);
      setTimeout(function(){
        hashHandler('wave:'+json.data.waveId, true);runQueue();
      },100)
    }
    var title = 'New Wave';
    //wave.blip.insert(content, xcf.rootBlipId, xcf.waveId, xcf.waveletId);
    wave.wavelet.setTitle(title, xcf.waveId, xcf.waveletId)
    runQueue();
  },500)
}

if(typeof window.onhashchange == "undefined"){
  setInterval(function(){
    window.onhashchange();
  },100)
}

window.onhashchange = function(){  
  hashHandler(location.hash);
}

function autosearchbox(){
  var query = document.forms.searchbox.query.value;
  if(query.toLowerCase().indexOf("wave:") == 0 || query.toLowerCase().indexOf("new:") == 0){
    hashHandler("#"+query, true);
  }else{
    hashHandler("#search:"+query, true);
  }
}
opt.x.no_scrollhistory = "Do not save search scroll position and restore to it"






opt.x.old_results = "Old results panel style";

opt.x.largeFont = 'Use a larger font';
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
opt.x.prefetch = "Prefetch waves and load them, way faster and also not real time";





function userList(users, expanded){ //because participant is a long word
  var USER_CUTOFF = small_screen?2:5;
  var span = document.createElement('span');
  if(users.length <= USER_CUTOFF || expanded){
    //todo: check if contributors are named robert<script>table.drop('students')</@googlewave.com
    
    span.innerHTML = users.join(", ")
          .replace(/antimatter15@googlewave.com/g,"<a href='http://antimatter15.com'>antimatter15</a>")
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






function startup(){
  wave.robot.notifyCapabilitiesHash(); //switch to l83s7 v3rz10n
  getUsername(); //get the username of the user
  
  if(location.hash.length < 2){
    hashHandler('#search:in:inbox');
  }else{
    hashHandler(location.hash);
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
  if(window.offline_cache){
		setTimeout(offline_cache, 1337)
	}
}

setTimeout(auto_start, 0);


function addTouchScroll(){
    var TS_CSS = 'lib/touchscroll.css';
    var TS_JS = 'lib/touchscroll.min.js';
    var elements = arguments;
    var link = document.createElement('link');
    link.href = TS_CSS;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.body.appendChild(link);
    var script = document.createElement('script');
    script.src = TS_JS;
    script.onload = function(){
        setTimeout(function(){
            for(var i = 0; i < elements.length; i++){
                var el = elements[i];
                console.log(el);
                if(typeof(el) == "string") el = document.getElementById(el);
                new TouchScroll(el, {elastic: true});
            }
        },100)
    }
    document.body.appendChild(script)
} 

opt.x.touchscroll = "Add the TouchScroll library to do cool scrolly things on iPad Multipane"
if(opt.touchscroll){
  
  addTouchScroll('wave_container_parent', 'search_parent_container')
  document.getElementById('wave_container_parent').style.width = (innerWidth-300)+'px';
  document.getElementById('wave_container').style.width = (innerWidth-300)+'px';
}

