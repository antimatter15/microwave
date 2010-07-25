opt.appName = '&mu;wave' //set the app name


opt.x.multipane = 'Enable multipane viewing experience (note, you must reload the page for changes to take effect)'
opt.x.touchscroll = "Add the TouchScroll library to do cool scrolly things on iPad Multipane"

opt.x.no_scrollhistory = "Do not save search scroll position and restore to it"
opt.x.old_results = "Old results panel style";

opt.x.largeFont = 'Use a larger font';

opt.x.prefetch = "Prefetch waves and load them, way faster and also not real time";

opt.x.gadgets = 'Enable real wave gadget support';
opt.x.render_state = 'If a gadget can not be internally rendered, display the gadget state';


if(opt.gadgets === undefined && screen_size > 900){
  opt.fn.set('gadgets', true)
}




if(opt.multipane === undefined && screen_size > 900){
  //default multipane on large screened
  opt.fn.set('multipane', true);
  if(mobilewebkit && opt.touchscroll === undefined){
    //default touchscroll on if multipane on for mobilewebkit
    opt.fn.set('touchscroll', true);
  }
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




function addTouchScroll(){
    var TS_CSS = 'js/lib/touchscroll.css';
    var TS_JS = 'js/lib/touchscroll.min.js';
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


if(opt.touchscroll && opt.multipane){
  addTouchScroll('wave_container_parent', 'search_parent_container')
  document.getElementById('wave_container_parent').style.width = (innerWidth-300)+'px';
  document.getElementById('wave_container').style.width = (innerWidth-300)+'px';
}

