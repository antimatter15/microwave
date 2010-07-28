function loading(text, nodelay){ 
  //we need to adjust for the possibility that the load is cancelled before it's actually loaded
	var load = getEl("loading");
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

        getEl("loadingtext").innerHTML = "<b>Loading</b> "+text;
      }

    }, nodelay?0:0); //it's unnerving when things flash, so only show after a wait
    return id;
  }
}
