function create_magic_box(name, submit_callback){
  var parent = document.createElement('div');
  parent.style.marginRight = "6px";
  parent.innerHTML = "<div class='alert'>"+name+"</div>"
  var textbox = document.createElement('textarea');
  var cancelbtn = document.createElement('button');
  var submitbtn = document.createElement('button');
  cancelbtn.innerHTML = 'Cancel';
  submitbtn.innerHTML = 'Submit';
  cancelbtn.onclick = function(){
    parent.style.display = 'none';
    current_blip = null;
    if(textbox.value.split(' ').length < 42 || confirm("Are you sure you want to cancel?")){
			parent.style.display = 'none';
			current_blip = null;
		}
  }
  submitbtn.onclick = function(){
    textbox.disabled = "disabled";
    setTimeout(function(){
      submit_callback(textbox.value);
    },100);
  }
  
  parent.style.marginTop = '10px';
  parent.appendChild(textbox);
  parent.appendChild(submitbtn);
  parent.appendChild(cancelbtn);
  parent.textbox = textbox; //i sure hope this isn't leaky
  
  return parent;
}

