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

if(mobilewebkit) document.body.className += ' mobilewebkit'; //yeah i know browser detection is bad, but how do i get around it here? 

if(!window.onLine) window.onLine = function(){return true};


