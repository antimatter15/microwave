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
