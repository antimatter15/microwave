var small_screen = true;
var oauth_key, oauth_secret;
oauth_key = localStorage.getItem('oauth_key');
oauth_secret = localStorage.getItem('oauth_secret');

if(opt.offline == undefined) opt.fn.set('offline',true);

function logoff(){
	logoff_ui();
	localStorage.setItem('oauth_secret','')
	localStorage.setItem('oauth_key','')
}

 function finish_setup(){
   var v = trim(getEl('login_code_box').value.toLowerCase());
   var xhr = new XMLHttpRequest();
   xhr.open('GET', "http://micro-wave.appspot.com/app/get_token?code="+v, true);
   xhr.onreadystatechange = function(){
     
     if(xhr.status == 200 && xhr.readyState == 4){
        if(xhr.responseText.indexOf(';') != -1){
         getEl('login_error').innerHTML = xhr.responseText + ';' +xhr.status + ';' + xhr.readyState;
         getEl('login_error').style.display = '';
         var parts = xhr.responseText.split(';');
         oauth_key = parts[0];
				 localStorage.setItem('oauth_key', oauth_key);
         oauth_secret = parts[1];
				 localStorage.setItem('oauth_secret', oauth_secret);
				 logon_ui();
         startup()
       }else{
         getEl('login_error').style.display = ''
       }
     }
   }
   xhr.send(null);
 }
 
function trim(str){
	return str.replace(/^\s+|\s+$/g,'');
}

var last_text = '';
setTimeout(function(){
  if(oauth_key && oauth_secret) return;
  var v = trim(getEl('login_code_box').value.toLowerCase());
  if(last_text != v) getEl('login_error').style.display = 'none';
  last_text = v;
  if(/^[a-z]{3}\d\d[a-z]{3}$/.test(v)){
    getEl('login_button').style.display = '';
  }else{
    getEl('login_button').style.display = 'none';
  }
  setTimeout(arguments.callee, 100);
})


if(!oauth_key || !oauth_secret){
  window.NO_STARTUP = true;
  setTimeout(function(){
      getEl('content').style.display = "none";
      getEl('appheader').style.display = "none";
      getEl('login').style.display = "";
			getEl('loading').style.display = 'none'
  },200);
}

    
    
    
window.doXHR = function(postdata, callback){
	if(!oauth_key || !oauth_secret) return console.log('operation cancelled. no keys.');
  var xhr = new XMLHttpRequest();
  //TODO: addd signature as header
  xhr.open('POST', 'https://www-opensocial.googleusercontent.com/api/rpc', true);
  xhr.setRequestHeader('Content-Type','application/json');
  xhr.setRequestHeader('Authorization',to_header(create_signature()));
  xhr.onreadystatechange = function(){
	console.log(xhr.readyState, xhr.status, xhr.responseText, xhr.statusText);
    if(xhr.readyState == 4){
      callback(xhr);
    }
  }
  xhr.send(postdata);

}
