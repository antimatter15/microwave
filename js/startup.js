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

