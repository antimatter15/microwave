function renderBlip(markup){
  var content = markup.content + ' '; //render an extra space at the end for rendering the user cursor annotations
  var annotation_starts = {}, annotation_ends = {};
  var user_colors = {};
  for(var i = 0; i < markup.annotations.length; i++){
    //iterate and note where the annotations end and start
    var note = markup.annotations[i];
    
    if(note.name.indexOf('user/d/') == 0){
      var user_session = note.value.split(',');
      var userid = note.name.substr(7);
      if(new Date - parseInt(user_session[1]) < 1000 * 60 * 60){ //expire after one haor
        user_colors[userid] = 'rgb(' +
                Math.floor(205-Math.random()*100).toString()+',' +
                Math.floor(205-Math.random()*100).toString()+',' +
                Math.floor(205-Math.random()*100).toString()+')';
      }
    }
    if(!annotation_starts[note.range.start]) 
      annotation_starts[note.range.start] = [i]
    else annotation_starts[note.range.start].push(i);
    if(!annotation_ends[note.range.end]) 
      annotation_ends[note.range.end] = [i]
    else annotation_ends[note.range.end].push(i);
  }
  var notes = {};
  var doc = document.createElement('div'), line = null, section = null;
  var htmlbuffer = '';
  for(var i = 0; i < content.length; i++){
    if(annotation_starts[i] || annotation_ends[i] || markup.elements[i]){
      if(htmlbuffer) section.appendChild(document.createTextNode(htmlbuffer));
  
      htmlbuffer = '';
      if(markup.elements[i]){
        //define new superelement and span
        var el = markup.elements[i];

        if(el.type == "INLINE_BLIP"){
          //var cont = document.createElement('div');
          //cont.style.border = "3px dotted blue";
          //cont.style.margin = '10px'
          //cont.innerHTML = '&lt;<b>inline</b> blip '+el.properties.id+'&gt;';
          //doc.appendChild(cont);
          
          doc.appendChild(inline_blip_render(el.properties.id));
        }else if(el.type == "IMAGE"){
          //this is actually something which shouldn't happen, it means that ur capabilities arent up to date
          var cont = document.createElement('div');
          //cont.style.border = "3px dotted orange";
          //cont.style.margin = '10px'
          //cont.innerHTML = '&lt;<b>Wave 1.0 Attachment</b> '+el.properties.attachmentId+' '+el.properties.caption+'&gt;';
          cont.innerHTML = '<b>'+(el.properties.attachmentId||'')+'</b> '+(el.properties.caption||'')+'<br>';
          if(el.properties.url){
            var img = document.createElement('img');
            img.src = el.properties.url;
						(function(img){
							img.onload = function(){
		           	if(small_screen && img.width > screen_size){
		             	img.style.width = "100%";
		             	img.onclick = function(){
		               	if(img.style.width.indexOf('%') == -1){
		                 	img.style.width = "100%";
		               	}else{
		                 	img.style.width = "";
		               	}
		             	}
		           	}
							}
          	})(img);
            cont.appendChild(img);
          }
          doc.appendChild(cont);
        }else if(el.type == "INSTALLER"){
          //this is actually something which shouldn't happen, it means that ur capabilities arent up to date
          var cont = document.createElement('div');
          cont.style.border = "3px dotted orange";
          cont.style.margin = '10px'
          cont.innerHTML = '&lt;<b>Extension Installer</b> '+el.properties.manifest+'&gt;';
          
          doc.appendChild(cont);
        }else if(el.type == "ATTACHMENT"){
          var cont = document.createElement('div');
          cont.style.margin = '10px'
          cont.innerHTML = '<b>'+el.properties.mimeType+'</b> '+el.properties.caption+'<br>';
          if(el.properties.mimeType.indexOf('image/') == 0){
            var img = document.createElement('img');
            img.src = el.properties.attachmentUrl;
						(function(img){
							img.onload = function(){
		           	if(small_screen && img.width > screen_size){
		             	img.style.width = "100%";
		             	img.onclick = function(){
		               	if(img.style.width.indexOf('%') == -1){
		                 	img.style.width = "100%";
		               	}else{
		                 	img.style.width = "";
		               	}
		             	}
		           	}
							}
          	})(img);
            //alert(img.style.width)
            cont.appendChild(img);
          }else{
            cont.innerHTML += "<a href='"+el.properties.attachmentUrl+"'>Download</a>"
          }
          doc.appendChild(cont);
        }else if(el.type == "GADGET"){
         
          doc.appendChild(renderGadget(el, markup));
        }else if(el.type != "LINE"){
          console.log('unknown element type', el.type, el.properties)
        }
        //implicitly create a new element anyway
        //if(el.type == "LINE"){
          line = document.createElement(el.properties.lineType || "p");
          if(el.properties.indent)
            line.style.marginLeft = el.properties.indent * 20 + 'px';
          if(el.properties.alignment)
            line.style.textAlign = ({l: 'left', c: 'center', r: 'right'})[el.properties.alignment];          
          if(el.properties.direction)
            line.setAttribute('dir',({l: 'ltr', r: 'rtl'})[el.properties.alignment]);
          doc.appendChild(line);
        //}
      }

      
      if(annotation_starts[i]){
        //add to the styles list/create new blah
        for(var k = annotation_starts[i], l = k.length; l--;){
          var note = markup.annotations[k[l]];
          if(!notes[note.name]) notes[note.name] = [];
          notes[note.name].push(note.value);
          
          if(note.name.indexOf('user/e/') == 0){
            var userid = note.name.substr(7);
            if(user_colors[userid]){
              var cursor = document.createElement('span');
              cursor.className = 'cursor';
              cursor.innerHTML = note.value.replace(/@.+/,'');
              cursor.style.backgroundColor = user_colors[userid];
              section.appendChild(cursor)
            }
          }
        }
      }
      if(annotation_ends[i]){
        //add to styles list/create new blah
        for(var k = annotation_ends[i], l = k.length; l--;){
          var note = markup.annotations[k[l]];
          notes[note.name].shift()
          if(notes[note.name].length == 0){
            delete notes[note.name];
          }
        }      
      }
      //create new span
      if(notes['link/auto'] || notes['link/manual'] || notes['link/wave']){ //probably needs some rewriting
        section = document.createElement('a');
      }else  section = document.createElement('span');
      line.appendChild(section);
      //apply the styles to the new span
      for(var note in notes){
        //if(notes[note].length == 0) continue;
        var val = notes[note][0];
        if(note.indexOf("style/") == 0){
          section.style[note.substr(6)] = val;
        }else if(note == "conv/title"){
          section.style.fontWeight = 'bold';
        }else if(note == 'spell'){
          //section.style.borderBottom = '1px solid #C00';
        }else if(note == 'lang'){
          //section.title = "Language: "+val;
        }else if(note == 'link/manual' || note == 'link/auto'){
					//handle waveid links
					if(/^waveid:\/\//.test(val)){
						section.href = '#wave:'+val.substr(9);
						section.setAttribute('onclick', 'ch(this)')
						//https://wave.google.com/wave/#restored:wave:googlewave.com%252Fw%252B7mNEVnmbA
					}else if(/wave:(.+?)(\,$)/.test(val)){
						section.href = '#wave:'+val.match(/wave:(.+?)(\,$)/)[1];
						section.setAttribute('onclick', 'ch(this)')
					}else{
          	section.href = val;
	          section.target = "_blank"
					}
        }else if(note == 'link/wave'){
          section.href = '#wave:'+val;
          section.setAttribute('onclick', 'ch(this)')
          
        }else if(note.indexOf("user/e") == 0){
          //ignore (parsed elsewhere)
        }else if(note.indexOf("user/d") == 0){
          //ignore
        }else if(note.indexOf("user/r") == 0){
          //ignore
        }else{
          console.log('unrecognized annotation', note, val);
        }
      }
    }
    if(content.charAt(i) != "\n")
      htmlbuffer += content.charAt(i);
    
  }
  if(htmlbuffer) section.appendChild(document.createTextNode(htmlbuffer));
  return doc;
}
