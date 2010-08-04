var queue = [];
var callbacks = {};
var id_count = 0;

if(!window.logoff){
	logoff = function(){
		if(confirm("Are you sure you want to log off?")){
			var xhr = new(window.ActiveXObject||XMLHttpRequest)('Microsoft.XMLHTTP');
			xhr.open('GET', '/logout', true);
			xhr.onreadystatechange = function(){
				if(xhr.readyState == 4){
					logoff_ui();
				}
			}
			xhr.send(null);
		}
	}
}

function logoff_ui(){
  loading(false);
	getEl('login').style.display = '';
	getEl('appheader').style.display = 'none';
	getEl('content').style.display = 'none';
}

function logon_ui(){
  loading(false);
	getEl('login').style.display = 'none';
	getEl('appheader').style.display = '';
	getEl('content').style.display = '';
}

function queueOp(method, params, callback){
  var id = (id_count++).toString();
  if(callback) callbacks[id] = callback;
  queue.push({
      id: id,
      method: method,
      params: params
    });
  return id;
}

//prepahrering fur moobilz klientz
if(!window.doXHR){
  window.doXHR = function(postdata, callback){
    //stolen shamelessly from the never-ending awesomeness of vxjs
    var xhr = new(window.ActiveXObject||XMLHttpRequest)('Microsoft.XMLHTTP');
    xhr.open('POST', '/rpc', true);
    xhr.setRequestHeader("Content-Type", "application/json"); 
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4){
        callback(xhr);
      }
    }
    xhr.send(postdata);
  }
}



function runQueue(){
  if(queue.length == 0) return false;
  for(var ids = [], i = 0; i < queue.length; i++)
    ids.push(queue[i].id);
  
  doXHR(JSON.stringify(queue), function(xhr){
    if(xhr.status == 200){
      var json;
      try{
        json = JSON.parse(xhr.responseText);
      }catch(err){
        
				if(xhr.responseText.indexOf("Error 401") != -1){
          return logoff_ui();
        }
          for(var i = 0; i < ids.length; i++){
          var cb_result = null;
          var id = ids[i];
          if(callbacks[id]){
            try{
              cb_result = callbacks[id]();
            }catch(err){}
            delete callbacks[id];
          }
          if(!cb_result){
            //alert('There was a server error, please try again. A');
            //if(xhr.responseText)alert(xhr.responseText);
						console.log('Server Error: Could not parse as JSON', xhr.responseText)
						error('JSON not parseable.');
          }
          }
      }
      if(json){
        //no error yay
        console.log(json)
        for(var i = 0; i < json.length; i++){
          //run each callback.
          var id = json[i].id;
          var cb_result = null;
          if(callbacks[id]){
            cb_result = callbacks[id](json[i]);
            delete callbacks[id];
          }
          if(json[i].error && !cb_result){
            if(json[i].error.code == 401){
              return logoff_ui()
              //alert('Your login token has expired\n'+xhr.responseText)
              //return location = '/?force_auth=true';
            }
            console.log("Error "+json[i].error.code+": "+json[i].error.message);
						error(json[i].error.message)
          }
        }
      }
    }else{
      for(var i = 0; i < ids.length; i++){
        var cb_result = null;
        var id = ids[i];
        if(callbacks[id]){
          try{
            cb_result = callbacks[id]();
          }catch(err){}
          delete callbacks[id];
        }
        if(!cb_result){
          console.log('Server Error: Error not caught.', xhr.status);
					error("No data was returned in the server response.")
        }
      }
    }
  })
  queue = [];
}

