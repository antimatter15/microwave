function create_magic_box(name){
  var edit_box = document.createElement('div');
  edit_box.style.marginRight = "6px";
  edit_box.innerHTML = "<div class='alert'>"+name+"</div>"
  var edit_text = document.createElement('textarea');
  var cancel_edit = document.createElement('button');
  var submit_edit = document.createElement('button');
  cancel_edit.innerHTML = 'Cancel';
  submit_edit.innerHTML = 'Submit';
  cancel_edit.onclick = function(){
    edit_box.style.display = 'none';
    current_blip = null;
    if(edit_text.value.split(' ').length < 42 || confirm("Are you sure you want to cancel?")){
			edit_box.style.display = 'none';
			current_blip = null;
		}
  }
  submit_edit.onclick = function(){
    edit_text.disabled = "disabled";
    setTimeout(function(){
      var rep_start = 0;
      try{
        for(var l = current_blip.annotations.length, i = 0;
          i < l && current_blip.annotations[i].name != 'conv/title'; i++){};
        if(i < l) rep_start = current_blip.annotations[i].range.end;
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

