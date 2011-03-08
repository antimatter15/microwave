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

function chronological_blip_render(parent){
  var blips = []
  for(var blip in msg.data.blips){
    blips.push(msg.data.blips[blip])
  }
  blips = blips.sort(function(a, b){
    return a.lastModifiedTime - b.lastModifiedTime
  })
  
  var singleBlip = function(i){
    var doc = blip_render(blips[i].blipId, parent);
    if(msg.data.blips[blips[i].parentBlipId] && doc){
      var blockquote = document.createElement("blockquote");
      var markup = msg.data.blips[blips[i].parentBlipId];
      var ht = markup.contributors.join(", ").replace(/@googlewave.com/g, "") + ":" + markup.content;
      blockquote.innerHTML = ht.substr(0,140) + (ht.length > 140?"...":"");
      blockquote.setAttribute("onclick", "msg.data.blips['"+markup.blipId+"'].dom.scrollIntoView()")
      doc.insertBefore(blockquote,doc.getElementsByTagName("div")[0].nextSibling)
      
    }
  }
  
  //for(var i = blips.length; i--;)singleBlip(i);
  var i = blips.length-1;
  (function(){
    var ii = Math.max(0, i-10);
    //console.log(i,blips[i]);
    for(;i >= ii; i--) singleBlip(i);
    
    if(ii) setTimeout(arguments.callee, 0);
  })()
}


function recursive_blip_render(blipid, parent){
  var doc = blip_render(blipid, parent);
  var blip = msg.data.blips[blipid];
  if(blip.childBlipIds.length > 0){
    if(blip.childBlipIds.length > 1){
      var thread = document.createElement("div");
      thread.className = "thread";
      for(var i = 1; i < blip.childBlipIds.length; i++){
        var child = recursive_blip_render(blip.childBlipIds[i], thread); //render children
      }
      if(thread.childNodes.length != 0)
        parent.appendChild(thread);
    }
    var child = recursive_blip_render(blip.childBlipIds[0], parent); //render children
  }
  return doc;
}

function bootstrap_thread_render(parent){
  var thread = msg.data.waveletData.rootThread;
  var children = thread.blipIds, clen = children.length, c = 0;
  
  var i = 0;
  (function(){
    var endlen = i+5;
    for(;i<endlen&&i<clen;)
      thread_render(children[i++], parent);
    
    if(i < clen) setTimeout(arguments.callee, 0);
  })()
  
  /*
  for(var children = thread.blipIds, clen = children.length, c = 0; c < clen; c++){
    var childid = children[c]; //These are root-level blips
    thread_render(childid, parent); 
  }
  */
}

function thread_render(blipid, parent){
  var blip = msg.data.blips[blipid];
	if(!blip) return;
  if(blip.dom) return;
  var doc = blip_render(blipid, parent); //render the blip and attach it to the current "parent" (including header and content)
  

  
  var threads = blip.replyThreadIds,  //get a list of threads which are children of the blip
      tlen = threads.length;

  if(tlen != 0){
    var threadel = document.createElement("div");
    threadel.className = "thread"; //the little dropshadow
    parent.appendChild(threadel);
    
    for(var t = 0; t < tlen; t++){
      var threadid = threads[t];
      var thread = msg.data.threads[threadid]; //get a reference to the specific thread
      for(var children = thread.blipIds, clen = children.length, c = 0; c < clen; c++){
        var childid = children[c];
        thread_render(childid, threadel); //recursively render each blip
      }
    }
  }
  return doc;
}
