function loading(text, nodelay){ 
  //we need to adjust for the possibility that the load is cancelled before it's actually loaded
	document.getElementById("loading").style.top = scrollY+'px';
	if(typeof text == "number"){
    document.getElementById("loading").style.display = "none";
    delete loadIds[text];
  }else{
    var id = Math.random()*42;
    loadIds[id] = true;
		setTimeout(function(){
      if(loadIds[id]){
        document.getElementById("loading").style.display = "";
        document.getElementById("loadingtext").innerHTML = "<b>Loading</b> "+text;
      }
    }, nodelay?0:0); //it's unnerving when things flash, so only show after a wait
    return id;
  }
}
