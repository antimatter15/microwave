function userList(users, expanded){ //because participant is a long word
  var USER_CUTOFF = small_screen?2:5;
  var span = document.createElement('span');
  if(users.length <= USER_CUTOFF || expanded){
    //todo: check if contributors are named robert<script>table.drop('students')</@googlewave.com
    
    span.innerHTML = users.join(", ")
          .replace(/antimatter15@googlewave.com/g,"<a href='http://antimatter15.com' target='_blank'>antimatter15</a>")
          .replace(/@.*?(\,|$)/g, "$1");
    if(expanded){
      var fewer = document.createElement('a');
      fewer.innerHTML = " (fewer)";
      fewer.href = "javascript:void(0)";
      fewer.onclick = function(){
        span.parentNode.replaceChild(userList(users), span);
        return false;
      }
      span.appendChild(fewer);
    }
  }else{
    span.innerHTML = users.slice(0,USER_CUTOFF).join(", ")
          .replace(/antimatter15@googlewave.com/g,"<a href='http://antimatter15.com'>antimatter15</a>")
          .replace(/@.*?(\,|$)/g, "$1");
    var more = document.createElement('a');
    more.innerHTML = " ... (" + (users.length-USER_CUTOFF) + " more)";
    more.href = "javascript:void(0)";
    more.onclick = function(){
      span.parentNode.replaceChild(userList(users, true), span);
      return false;
    }
    span.appendChild(more);
  }
  return span
}




function format_time(date){
  if(typeof date == "number"){
    var date2 = new Date();
    date2.setTime(date);
    date = date2;
  }
  var hr = date.getHours(), ampm = "am";
  if(hr > 12){ hr = hr - 12; ampm = "pm"}
  if(hr == 0){hr = 12}
  var minute = date.getMinutes().toString()
  if(minute.length == 1) minute = "0"+minute;
  return (date.getMonth()+1)+"/"+(date.getDate())+" "+hr+":"+minute+ampm;
}


function inline_blip_render(blipid){
  var doc = document.createElement("div");
  doc.className = "thread"
  blip_render(blipid, doc);
  return doc;
}

function blip_render(blipid, parent){ //a wrapper around renderBlip that adds chrome related things
  var blip = msg.data.blips[blipid];
  if(!blip || blip.dom) return; //already rendered, go on
  
  
  var doc = renderBlip(blip);
  msg.data.blips[blipid].dom = doc;
  doc.className = "message";

  var info = document.createElement("div");
  info.className = "info";

  blip.info = info;
    
  var nextblip = (chronological_blips[0] == blipid)?' <span class="blipend">X</span>':" <span class='nextarr'>&rarr;</span></div>";
  info.innerHTML = "<div style='float:right;color:#555'>"+format_time(blip.lastModifiedTime).toString()+nextblip;//<b>By</b> ";
  info.appendChild(userList(blip.contributors));
  info.onclick = function(e){
    e = e || window.event;
    e.cancelBubble = true;
    if(e.stopPropagation) e.stopPropagation();
    var tag = (e.target||e.srcElement).tagName.toLowerCase();
    if(tag != "a"){
     blip_next(blip.blipId)
    }
  }
  doc.onclick = function(e){
    e = e || window.event;
    e.cancelBubble = true;
    if(e.stopPropagation) e.stopPropagation();
    var tag = (e.target||e.srcElement).tagName.toLowerCase();
    if(tag != "a"){
      console.log(blip);
      info.parentNode.insertBefore(create_contextmenu(blip), info.nextSibling);
    }
  }
  doc.insertBefore(info, doc.firstChild);
  parent.appendChild(doc);
  
  if(blipid == chronological_blips[scrollto_position]){
    setTimeout(function(){
      blip_scroll(scrollto_position);
    },500);
  }
  
  return doc;
}
