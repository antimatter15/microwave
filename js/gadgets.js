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
