function startup(){
  if(onLine()){
		wave.robot.notifyCapabilitiesHash(); //switch to l83s7 v3rz10n
		getUsername(); //get the username of the user
		//TODO: something to pull username from cache if offline?
	}
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

