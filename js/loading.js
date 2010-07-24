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
