/*
 Copyright 2010 antimatter15

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
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

