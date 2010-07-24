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

if(mobilewebkit){
  document.body.className += ' mobilewebkit'; //yeah i know browser detection is bad, but how do i get around it here? 
}
if(!window.onLine){
	window.onLine = function(){return true};
}




if(opt.multipane === undefined && screen_size > 900 && !mobilewebkit){
  opt.fn.set('multipane', true)
}


opt.x.multipane = 'Enable multipane viewing experience (note, you must reload the page for changes to take effect)'


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

