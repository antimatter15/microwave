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
    var h = '<div style="padding:7px;padding-bottom:100px;"><h1 onclick="opt.fn.close()">'+(opt.appName||'')+' Settings</h1>';
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
    e.style.zIndex = 999999999999;
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


//File: js/opt.js


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

opt.x.touchscroll = "Add the TouchScroll library to do cool scrolly things on iPad Multipane"
if(opt.touchscroll){
  addTouchScroll('wave_container_parent', 'search_parent_container')
  document.getElementById('wave_container_parent').style.width = (innerWidth-300)+'px';
  document.getElementById('wave_container').style.width = (innerWidth-300)+'px';
}




//File: js/blip.js


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

function blip_render(blipid, parent){ //a wrapper around renderBlip that adds chrome related things
  var blip = msg.data.blips[blipid];
  if(!blip || blip.dom) return; //already rendered, go on
  
  
  var doc = renderBlip(blip);
  msg.data.blips[blipid].dom = doc;
  doc.className = "message";

  var info = document.createElement("div");
  info.className = "info";

  blip.info = info;
    
  var nextblip = (chronological_blips[0] == blipid)?' <span class="blipend">X</span>':" <span class='nextarr'>&rarr;</span></div>";
  info.innerHTML = "<div style='float:right;color:#555'>"+format_time(blip.lastModifiedTime).toString()+nextblip;//<b>By</b> ";
  info.appendChild(userList(blip.contributors));
  info.onclick = function(e){
    e = e || window.event;
    e.cancelBubble = true;
    if(e.stopPropagation) e.stopPropagation();
    var tag = (e.target||e.srcElement).tagName.toLowerCase();
    if(tag != "a"){
     blip_next(blip.blipId)
    }
  }
  doc.onclick = function(e){
    e = e || window.event;
    e.cancelBubble = true;
    if(e.stopPropagation) e.stopPropagation();
    var tag = (e.target||e.srcElement).tagName.toLowerCase();
    if(tag != "a"){
      console.log(blip);
      info.parentNode.insertBefore(create_contextmenu(blip), info.nextSibling);
    }
  }
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


var current_blip = null, context_box, reply_box, reply_text, cancel, post;
function create_reply_box(indented){
  if(window.content_box){
    try{
    content_box.innerHTML = '';
    content_box.parentNode.removeChild(content_box)
    }catch(err){};
  }
  //if(!context_box || context_box.innerHTML == ''){ //ie does suck doesnt it
    context_box = document.createElement('div');
    reply_box = document.createElement('div');
    reply_box.innerHTML = "<div class='alert'><b>Write a Reply</b></div>"
    reply_text = document.createElement('textarea');
    cancel = document.createElement('button');
    post = document.createElement('button');
    //post.style['float'] = 'right';
    //cancel.style['float'] = 'right';
    cancel.innerHTML = 'Cancel';
    post.innerHTML = 'Post';
    cancel.onclick = function(){
      if(reply_text.value.split(' ').length < 42 || confirm("Are you sure you want to cancel?")){
        context_box.style.display = 'none';
        current_blip = null;
      }
    }
    post.onclick = function(){
      reply_text.disabled = "disabled";
      setTimeout(function(){
        //if(indented){
          wave.blip.contentCreateChild(reply_text.value,current_blip.blipId,current_blip.waveId,current_blip.waveletId);
          //wave.blip.contentContinueThread(reply_text.value,current_blip.blipId,current_blip.waveId,current_blip.waveletId);
        //}else{
        //  wave.wavelet.appendBlip(reply_text.value, current_blip.blipId, current_blip.waveId, current_blip.waveletId);
        //}
        loadWave(current_blip.waveId);
        auto_reload = true;
        runQueue()
      },100);
    }
    context_box.style.marginTop = '10px';
    reply_box.appendChild(reply_text);
    reply_box.appendChild(post);
    reply_box.appendChild(cancel);
    context_box.appendChild(reply_box);
  //}
  context_box.style.display = 'none';
  reply_text.disabled = "";
  
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
  
  reply_text.value = '';
  
  if(!opt.no_sig) reply_text.value = '\n\nPosted with micro-wave.appspot.com'+addonsig;
  reply_text.className = 'reply_box';
  return context_box;
}


ctx_menu = null;


function create_contextmenu(blip){
  if(!onLine()) return document.createElement('div'); 
//offline doesnt support queuing operations to be done when online, 
//so just dont show prompts

  function closectx(){
    div.style.display = 'none';
    div.parentNode.removeChild(div);
  }
  try{
    ctx_menu.style.display = 'none'
    ctx_menu.parentNode.removeChild(ctx_menu);
  }catch(err){}
  var div = document.createElement("div");
  current_blip = blip;
  div.style.zIndex = 32;
  var actions = {
    "Reply": function(){
      current_blip.dom.parentNode.insertBefore(create_reply_box(),current_blip.dom.nextSibling);
      context_box.className = blip.childBlipIds.length > 0?"thread":"";
      context_box.style.display = '';
      reply_text.focus();
      closectx();
    },/*
    "Indented": function(){
      current_blip.dom.parentNode.insertBefore(create_reply_box(true),current_blip.dom.nextSibling);
      context_box.className = blip.childBlipIds.length > 0?"thread":"";
      context_box.style.display = '';
      reply_text.focus();
      closectx();
    },*/
    "Delete": function(){
      if(confirm("Are you sure you want to delete the blip?")){
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
      current_blip.dom.parentNode.insertBefore(create_edit_box(),current_blip.dom.nextSibling);
      //TODO: MAKE THIS PURTIER
      var rep_start = 0;
      try{
        for(var l = current_blip.annoations.length, i = 0;
          i < l && current_blip.annotations[i].name != 'conv/title'; i++){};
        if(i < l) rep_start = current_blip.annotations[i].range.end;
      }catch(err){}
      
      edit_text.value = current_blip.content.substr(rep_start + 1); //first char is a newline
      edit_text.focus();
      closectx();
    }
  };
  if(blip.blipId == msg.data.waveletData.rootBlipId){
    actions['Change Title'] = function(){
      var title = prompt("Enter new wavelet title", msg.data.waveletData.title);
      if(title){
        wave.wavelet.setTitle(title, blip.waveId, blip.waveletId);
        loadWave(blip.waveId, blip.waveletId);
        auto_reload = true;
        runQueue();
      }
    }
    /*actions['Mark Wave Read'] = function(){
      wave.robot.folderAction('markAsRead', blip.waveId, blip.waveletId)
      closectx();
      runQueue();
    }*/
    
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


function create_edit_box(){
  edit_box = document.createElement('div');
  edit_box.style.marginRight = "6px";
  edit_box.innerHTML = "<div class='alert'><b>Edit Blip (Beta)</b></div>"
  edit_text = document.createElement('textarea');
  cancel_edit = document.createElement('button');
  submit_edit = document.createElement('button');
  cancel_edit.innerHTML = 'Cancel';
  submit_edit.innerHTML = 'Submit';
  cancel_edit.onclick = function(){
    edit_box.style.display = 'none';
    current_blip = null;
  }
  submit_edit.onclick = function(){
    edit_text.disabled = "disabled";
    setTimeout(function(){
      var rep_start = 0;
      try{
        for(var l = current_blip.annoations.length, i = 0;
          i < l && current_blip.annotations[i].name != 'conv/title'; i++){};
        if(i < l) rep_start = current_blip.annotations[i].range.end;
      }catch(err){}
      
      
      var change = diff(current_blip.content.substr(rep_start), '\n'+edit_text.value);
      console.log(change);
      console.log(current_blip.content, '\n'+edit_text.value)
      
      wave.blip.replace_range(change[2], 
                              rep_start + change[0], 
                              rep_start + change[1], 
                              current_blip.blipId, current_blip.waveId, current_blip.waveletId)
      loadWave(current_blip.waveId);
      auto_reload = true;
      runQueue()
    },100);
  }
  edit_box.style.marginTop = '10px';
  edit_box.appendChild(edit_text);
  edit_box.appendChild(submit_edit);
  edit_box.appendChild(cancel_edit);
  
  var boxheight = Math.max(current_blip.dom.offsetHeight,100)
  edit_text.style.height = boxheight+'px';
  edit_text.className = 'edit_box'

  return edit_box;
}



//File: js/gadgets.js


var gstates = {};
var REMOTE_RPC_RELAY_URL =
    "http://www.gmodules.com/gadgets/files/container/rpc_relay.html";

var DEFAULT_GADGET_MODE = {'${playback}': '0', '${edit}': '1'};

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
  // TODO: Use global objects or pool?
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

/**
 * Initializes the gadget system, call this once at startup.
 */
function initGadgetSystem() {
  // Once a gadget has called us back, we can inject the state/participants.
  registerRpc("wave_enable", function(service, gadgetId, args) {
    gadgets.rpc.setRelayUrl(gadgetId, REMOTE_RPC_RELAY_URL);
    extractGadgetState(gadgetId);
  });

  registerRpc("resize_iframe", function(service, gadgetId, args) {
    document.getElementById(gadgetId).height = args[0]
  });

  gadgets.rpc.registerDefault(function() {
    var eventType = this['s'];
    var eventObj = this['a'][0];
    var gadgetId = this['f'];
    console.log(this);
    if(eventType == 'wave_gadget_state'){
      console.log('updating state');
      for(var i in eventObj){
        gstates[gadgetId].state[i] = eventObj[i];
      }
      wave.blip.update_element(gstates[gadgetId].state, gstates[gadgetId].blipId, current_wave, current_wavelet);
      runQueue();
      gadgets.rpc.call(gadgetId, "wave_gadget_state", null, gstates[gadgetId].state);
    }
    console.log(eventType,eventObj);
  });
}


function create_gadget_frame(id, gadget_url, container){
    //thanks to douwe.osinga@googlewave.com for this code!
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

opt.x.gadgets = 'Enable real wave gadget support';
if(opt.gadgets === undefined && screen_size > 900){
  opt.fn.set('gadgets', true)
}



opt.x.render_state = 'If a gadget can not be internally rendered, display the gadget state';

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


//File: js/loading.js


function loading(text, nodelay){ 
  //we need to adjust for the possibility that the load is cancelled before it's actually loaded
	var load = document.getElementById("loading");
	var has_opacity = typeof document.createElement('div').style.opacity != 'undefined';
	load.style.top = scrollY+'px';
	if(typeof text == "number"){
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

        document.getElementById("loadingtext").innerHTML = "<b>Loading</b> "+text;
      }

    }, nodelay?0:0); //it's unnerving when things flash, so only show after a wait
    return id;
  }
}



//File: js/nav.js


//navigation stuffs
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


opt.x.use_protocol_21 = 'Use old 0.21 version of wave protocol';

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
      return wave.document.modify({modifyHow: "REPLACE", values: ['\n'+content]}, blipId, waveId, waveletId)
    },
    "replace_range": function(content, start, end, blipId, waveId, waveletId){
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
    
    "insert": function(content, blipId, waveId, waveletId){
      return wave.document.modify({modifyHow: "INSERT", values: ['\n'+content]}, blipId, waveId, waveletId)
    },
    "append": function(content, blipId, waveId, waveletId){
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




//File: js/opt.js


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

opt.x.touchscroll = "Add the TouchScroll library to do cool scrolly things on iPad Multipane"
if(opt.touchscroll){
  addTouchScroll('wave_container_parent', 'search_parent_container')
  document.getElementById('wave_container_parent').style.width = (innerWidth-300)+'px';
  document.getElementById('wave_container').style.width = (innerWidth-300)+'px';
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
    
    for(t = 0; t < tlen; t++){
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
      if(new Date - parseInt(user_session[1]) < 1000 * 60 * 60){ //expire after one haor
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
            var img = document.createElement('img');
            img.src = el.properties.url;
						(function(img){
							img.onload = function(){
		           	if(small_screen && img.width > screen_size){
		             	img.style.width = "100%";
		             	img.onclick = function(){
		               	if(img.style.width.indexOf('%') == -1){
		                 	img.style.width = "100%";
		               	}else{
		                 	img.style.width = "";
		               	}
		             	}
		           	}
							}
          	})(img);
            cont.appendChild(img);
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
          if(el.properties.mimeType.indexOf('image/') == 0){
            var img = document.createElement('img');
            img.src = el.properties.attachmentUrl;
						(function(img){
							img.onload = function(){
		           	if(small_screen && img.width > screen_size){
		             	img.style.width = "100%";
		             	img.onclick = function(){
		               	if(img.style.width.indexOf('%') == -1){
		                 	img.style.width = "100%";
		               	}else{
		                 	img.style.width = "";
		               	}
		             	}
		           	}
							}
          	})(img);
            //alert(img.style.width)
            cont.appendChild(img);
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
          section.href = val;
          section.target = "_blank"
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
          alert('Your login token has expired\n'+xhr.responseText)
          return location = '/?force_auth=true';
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
            alert('There was a server error, please try again. A');
            if(xhr.responseText)alert(xhr.responseText);
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
              
              alert('Your login token has expired\n'+xhr.responseText)
              return location = '/?force_auth=true';
            }
            alert("Error "+json[i].error.code+": "+json[i].error.message)
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
            alert('There was a server error, please try again. B');
            if(xhr.responseText)alert(xhr.responseText);
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
  if(query == current_search && current_page == 1 && search_outdated == false){
    document.getElementById('suggest').style.display = '';
    searchmode(0);
    current_page = 0;
    search_container.style.display = '';
    if(!opt.no_scrollhistory){
//      document.body.scrollTop = searchscroll;
      scrollTo(0, searchscroll)
    }
    if(!opt.multipane){
      wave_container.style.display = 'none';
      msg = {};
      wave_container.innerHTML = '';
    }
  }else{  
    current_search = document.forms.searchbox.query.value = query;
    update_search();
  }
  document.getElementById('floating_menu').style.display = 'none';
}

function searchmode(mode){
  //return //it appears most computers cant do it
  //change the little back button icon in ways which iPhone cant do
  
  //if(mobilewebkit) return;
  //document.getElementById("search_go").style.display = mode?"none":"";
  //document.getElementById("search_back").style.display = mode?"":"none";
}



opt.x.recursive_renderer = 'Use old version of tree wave renderer, only works on Wave Protocol 0.21 or below';
opt.x.no_sig = 'Do not automatically add <i>posted with micro-wave</i> signature';


opt.x.owner_utils = 'Enable utilities for wave creators';
opt.x.no_autoscroll = 'Disable smart autoscroll to latest blip';

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
  msg = {};
  
  extend_search(0, function(){
    loading(loadId);
    document.getElementById('suggest').style.display = '';
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
  callbacks[wave.robot.search(current_search,startIndex||0,42)] = function(data){
    if(callback)callback();
    msg = data; //globalization is good
    console.log(msg);
    var shtml = '';
    var item, digests = msg.data.searchResults.digests;
    if(opt.prefetch){
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
        var content = '<div class="search '+resultClass(item.waveId)+'"><div class="date">'+time+'<br>'+msg+'</div><span class="title_'+(item.unreadCount > 0 ? "unread": "read")+'">' + item.title+"</span> <span class='snippet'>"+ item.snippet +"</span></div>";
        
        if(item.waveId.indexOf('treq') != -1){
          shtml += '<a class="searchlink">'+content+'</a>'
        }else{
          shtml += '<a href="#wave:'+item.waveId+'" class="searchlink" onclick=\'ch(this)\'>'+content+'</a>';
        }
      }
    }
    search_container.innerHTML += shtml;
    if(digests.length < 42){
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
  if(onLine() == false) return window.offline_loadWave(waveId);
  waveId = waveId.replace("/", '!');
  waveletId = waveletId || waveId.replace(/[\/!].+/,'!conv+root')
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
        
        //document.body.scrollTop = 0;
        scrollTo(0,0);
        if(!opt.no_autoscroll){
          if(unread_blips[waveId]){ //ignore if zero or undefined
            //scrollto_blipid = chronological_blips[0];
            scrollto_position = unread_blips[waveId];
          }
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
    tags.appendChild(document.createTextNode(t))
    tags.innerHTML += ' <a href="javascript:add_tag()" style="float:right">Add</a>';
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



//File: js/lib/json.js


/*
    http://www.JSON.org/json2.js
    2010-03-20

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());


//File: js/startup.js


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




