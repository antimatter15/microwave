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

function blip_nav(delta){ 
  //deprecated, not really used
  //TOTALLY counterintuitive. It's backwards. To go to a newer one, do -1 to do a older one, do +1
  var backup_pos = scrollto_position;
  try{
    msg.data.blips[chronological_blips[scrollto_position+=delta]].dom.scrollIntoView();
  }catch(err){
    scrollto_position = backup_pos;
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



opt.x.recursive_renderer = 'Use old version of tree wave renderer, only works on Wave Protocol 0.21 or below';
opt.x.no_sig = 'Do not automatically add <i>posted with micro-wave</i> signature';

var current_blip = null, context_box, reply_box, reply_text, cancel, post;
function create_context_box(indented){
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
    header.appendChild(userList(waveContent.data.waveletData.participants));
    var add = document.createElement('a');
    add.innerHTML = ' Add Participant'
    add.className = 'addparticipant';
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
  }
  if(opt.prefetch && prefetched_waves[waveId]){
    load_callback(JSON.parse(JSON.stringify(prefetched_waves[waveId])));
  }else{
    callbacks[wave.robot.fetchWave(waveId, waveletId)] = load_callback;
  }
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
      current_blip.dom.parentNode.insertBefore(create_context_box(),current_blip.dom.nextSibling);
      context_box.className = blip.childBlipIds.length > 0?"thread":"";
      context_box.style.display = '';
      reply_text.focus();
      closectx();
    },/*
    "Indented": function(){
      current_blip.dom.parentNode.insertBefore(create_context_box(true),current_blip.dom.nextSibling);
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
        if(current_blip.annotations[0].name == 'conv/title') rep_start = current_blip.annotations[0].range.end;
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
        if(current_blip.annotations[0].name == 'conv/title') rep_start = current_blip.annotations[0].range.end;
        //TODO: replace this with something which always works, sometimes it doesn't when there's an annotation above it
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



if(!this.JSON)this.JSON={};
(function(){function l(b){return b<10?"0"+b:b}function o(b){p.lastIndex=0;return p.test(b)?'"'+b.replace(p,function(f){var c=r[f];return typeof c==="string"?c:"\\u"+("0000"+f.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+b+'"'}function m(b,f){var c,d,g,j,i=h,e,a=f[b];if(a&&typeof a==="object"&&typeof a.toJSON==="function")a=a.toJSON(b);if(typeof k==="function")a=k.call(f,b,a);switch(typeof a){case "string":return o(a);case "number":return isFinite(a)?String(a):"null";case "boolean":case "null":return String(a);
case "object":if(!a)return"null";h+=n;e=[];if(Object.prototype.toString.apply(a)==="[object Array]"){j=a.length;for(c=0;c<j;c+=1)e[c]=m(c,a)||"null";g=e.length===0?"[]":h?"[\n"+h+e.join(",\n"+h)+"\n"+i+"]":"["+e.join(",")+"]";h=i;return g}if(k&&typeof k==="object"){j=k.length;for(c=0;c<j;c+=1){d=k[c];if(typeof d==="string")if(g=m(d,a))e.push(o(d)+(h?": ":":")+g)}}else for(d in a)if(Object.hasOwnProperty.call(a,d))if(g=m(d,a))e.push(o(d)+(h?": ":":")+g);g=e.length===0?"{}":h?"{\n"+h+e.join(",\n"+h)+
"\n"+i+"}":"{"+e.join(",")+"}";h=i;return g}}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+l(this.getUTCMonth()+1)+"-"+l(this.getUTCDate())+"T"+l(this.getUTCHours())+":"+l(this.getUTCMinutes())+":"+l(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()}}var q=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
p=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,h,n,r={"\u0008":"\\b","\t":"\\t","\n":"\\n","\u000c":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},k;if(typeof JSON.stringify!=="function")JSON.stringify=function(b,f,c){var d;n=h="";if(typeof c==="number")for(d=0;d<c;d+=1)n+=" ";else if(typeof c==="string")n=c;if((k=f)&&typeof f!=="function"&&(typeof f!=="object"||typeof f.length!=="number"))throw new Error("JSON.stringify");return m("",
{"":b})};if(typeof JSON.parse!=="function")JSON.parse=function(b,f){function c(g,j){var i,e,a=g[j];if(a&&typeof a==="object")for(i in a)if(Object.hasOwnProperty.call(a,i)){e=c(a,i);if(e!==undefined)a[i]=e;else delete a[i]}return f.call(g,j,a)}var d;b=String(b);q.lastIndex=0;if(q.test(b))b=b.replace(q,function(g){return"\\u"+("0000"+g.charCodeAt(0).toString(16)).slice(-4)});if(/^[\],:{}\s]*$/.test(b.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){d=eval("("+b+")");return typeof f==="function"?c({"":d},""):d}throw new SyntaxError("JSON.parse");}})();
