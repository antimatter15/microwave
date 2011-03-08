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

function loading(text, nodelay){ 
  //we need to adjust for the possibility that the load is cancelled before it's actually loaded
	var load = getEl("loading");
	var has_opacity = typeof document.createElement('div').style.opacity != 'undefined';
	load.style.top = scrollY+'px';
	if(typeof text == "number" || text === false){
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

        getEl("loadingtext").innerHTML = "<b>Loading</b> "+text;
      }

    }, nodelay?0:0); //it's unnerving when things flash, so only show after a wait
    return id;
  }
}


function error(text){
	var e = getEl('error');
	e.style.display = '';
	getEl('errortext').innerHTML += '<div><b>Error:</b> '+text+'</div>';
	e.onclick = function(){
		e.style.display = 'none';
		getEl('errortext').innerHTML = '';
	}
}
