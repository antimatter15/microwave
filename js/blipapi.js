function Annotation(name, value, start, end){
  return {
    serialize: function(){
      return {'name': name,
            'value': value,
            'range': {'start': start,
                      'end': end}}
    }
  }
}



function BlipRefs(blip, maxres){
  this._blip = blip;
  this._maxres = maxres || 1;
  this.all = function(blip, findwhat, maxres){
    var obj = new BlipRefs(blip, maxres || -1),
        restrictions = [].slice.call(arguments, 2);
    obj._findwhat = findwhat;
    obj._restrictions = restrictions;
    obj._hits = function(){
      return obj._find.apply(this, [findwhat, maxres].concat(restrictions));
    }
    if(!findwhat){
      //no findWhat, take entire blip
      obj._params = {}
    }else{
      var query = {maxRes: maxres}
      if(typeof findwhat == 'string'){
        query.textMatch = findwhat
      }else{
        query.elementMatch = findwhat.class_type
        query.restrictions = restrictions;
      }
      obj._params = {modifyQuery: query}
    }
  }
  this.range = function(blip, begin, end){
    var obj = new BlipRefs(blip);
    obj._begin = begin;
    obj._end = end;
    obj._hits = function(){
      return [begin, end]
    }
    obj._params = {range: {start: begin, end: end}}
    return obj
  }
  //this._elem_matches
  this._find = function(what, maxres){
    var restrictions = [].slice.call(arguments, 2),
        blip = this._blip;
    if(!what){
      throw "StopIteration"
    }
    if(typeof what == 'string'){
      var index = blip._content.find(what)
      var count = 0;
      while(index != -1){
        count += 1;
      }
    }else{
    }
        
  }
  
  this._execute = function(modify_how, what, bundled_annotations){
    var blip = this._blip, next_index;
    if(modify_how != 'DELETE'){
      if(!what.length) what = [what];
      next_index = 0;
    }
    var matched = [],
        updated_elements = [];
    
    var next, hit_found = false;
    var hits = this._hits();
    for(var i = 0, l = hits.length; i < l; i++){
      var start = hits[i][0], end = hits[i][0];
      var hit_found = true;
      var bliplen = blip.length //erm what? is it blip.contents.length?
      if(start < 0){
        start += bliplen;
        if(end == 0) end += bliplen;
      }
      if(end < 0) end += bliplen;
      if(bliplen == 0){
        if(start != 0 || end != 0) throw "IndexError: Start and end have to be 0 for empty document";
      }else if(start < 0 || end < 1 || start >= bliplen || end > bliplen){
        throw "IndexError: Position outside document"
      }
      if(modify_how == 'DELETE'){
        for(var i = start; i < end; i++){
          if(i in blip._elements)
            delete blip._elements[i];
          blip._delete_annotations(start, end);
          blip._shift(end, start - end);
          blip._content = blip._content.substr(0,start) + blip._content.substr(end)
        }
      }else{
        if(typeof what == 'function'){
          next = what(blip._content, start, end);
          matched.append(next);
        }else{
          next = what[next_index]
          next_index = (next_index + 1) % what.length;
        }
        //dont do string force unicode stuff cause thats not so much an issue. hopefully.
        if(modify_how == 'ANNOTATE'){
          var key = next[0], value = next[1];
          blip.annotations._add_internal(key, value, start, end);
        }else if(modify_how == 'CLEAR_ANNOTATION'){
          blip.annotations._delete_internal(next, start, end);
        }else if(modify_how == 'UPDATE_ELEMENT'){
          var el = blip._elements.get(start);
          updated_elements.push({type: el.type, properties: next});
          //uh what?
        }else{
          if(modify_how == 'INSERT') end = start;
          else if(modify_how == 'INSERT_AFTER') start = end;
          else if(modify_how != 'REPLACE') {
            throw "ValueError: Unexpected modify_how: "+modify_how;
          }
          //check if typeof next is element.
          var text = next;
          if(start != end && text.length < end - start) blip._delete_annotations(start + text.length, end);
          blip._shift(end, text.length + start - end);
          blip._content = blip._content.substr(0,start) + text + blip._content.substr(end)
          if(bundled_annotations){
            var end_annotation = start + text.length;
            blip._delete_annotations(start, end_annotation);
            for(var key in bundled_annotations)
              blip.annotations._add_internal(key, bundled_annotations[value], start, end_annotation);
          }
          //if next is type element blip._elements[start] = next 
        }
      }
    }
    if(!hit_found) return;
    var operation = blip._operation_uque.document_modify(blip.wave_id, blip.wavelet_id, blip.blip_id);
    var items = self._params.items();
    for(var i in items)
      operation.set_param(param, value);
    modify_action = {modifyHow: modify_how};
    if(modify_how == 'DELETE'){
    }else if(modify_how == 'UPDATE_ELEMENT'){
      modify_action.elements = updated_elements;
    }else if(modify_how == 'REPLACE' || modify_how == 'INSERT'  || modify_how == 'INSERT_AFTER'){
      if(typeof what == 'function') what = matched;
      if(what){
        //check if next is type element
        //or else
        modify_action.elements = what;
      }
    }else if(modify_how == 'ANNOTATE'){
      for(var z = what.length, q = 0, x = []; q < z; q++) x.push(what[q][1]); //would be so much nicer if I didn't have to support IE
      modify_action.values = x;
      modify_action.annotationKey = what[0][0];
    }else if(modify_how == 'CLEAR_ANNOTATION'){
      modify_action.annotationKey = what[0]
    }
    if(bundled_annotations){
      var bundled = [];
      for(var key in bundled_annotations)
        bundled.push({key: key, value: bundled_annotations[key]});
      modify_action.bundledAnnotations = bundled;
    }
    operation.set_param('modifyAction', modify_action)
    return this
  }
  
  this.insert = function(what, bundled_annotations){
    return this._execute('INSERT', what, bundled_annotations);
  }
  this.insert_after = function(what, bundled_annotations){
    return this._execute('INSERT_AFTER', what, bundled_annotations);
  }
  this.replace = function(what, bundled_annotations){
    return this._execute('REPLACE', what, bundled_annotations);
  }
  this.remove = this['delete'] = function(){
    return this._execute('DELETE');
  }
  this.annotate = function(name, value){
    var what = value?[name, value]:name;
    return this._execute('ANNOTATE', what);
  }
  this.clear_annotation = function(name){
    return this._execute('CLEAR_ANNOTATION', name);
  }
  this.update_element = function(new_values){
    return this._execute('UPDATE_ELEMENT', new_values);
  }
}

