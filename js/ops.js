username = 'wheisenberg@googlewave.com';

//TODO: move this into wave.robot.getUserAddress
function getUsername(){
  //ROFLMAO this is an EPIC HACK
  callbacks[wave.robot.fetchWave('googlewave.com!w+bWEBb5mBA', //wave that nobody can read
                                 'googlewave.com!conv+poop') //just be a little more certain
                                 ] = function(json){
    username = json.error.message.match(/internalError: (.+@.+) is not a participant/)[1]
    return true //trigger to not get user to see message of user
  };
}

function clean_text(text){
	return text.replace(/[\0-\x09\x0b-\x1f\x7f\x80-\x9f\u2028\u2029\ufff9\ufffa\ufffb\u200e\u200f\u202a-\u202e]/g,'');
}


wave = {
  robot:{
    fetchWave: function(waveId, waveletId){
      return queueOp('wave.robot.fetchWave',{waveId: waveId, waveletId: waveletId})
    },
    "search": function(query, index, numResults){
      return queueOp('wave.robot.search', {query: query, index: index, numResults: numResults});
    },
    folderAction: function(modifyHow, waveId, waveletId){
      return queueOp('wave.robot.folderAction', {waveId: waveId, modifyHow: modifyHow, waveletId: waveletId});
    },
    notifyCapabilitiesHash: function(protocolVersion){
      var defaultVersion = (opt.use_protocol_21?0.21:0.22).toString();
      return queueOp('wave.robot.notifyCapabilitiesHash', {protocolVersion: protocolVersion||defaultVersion});
    },
    createWavelet: function(participants, preconf){ //awkkwurrdd!
      var rootBlipId = "TBD_"+waveletId+"_0x"+(Math.random()*9e5).toString(16);
      var wavehost = username.replace(/^.+@/,'');
      var waveletId = wavehost+"!conv+root";
      var waveId = wavehost+"!TBD_0x"+(Math.random()*9e5).toString(16);
      if(!preconf) preconf = {};
      preconf.waveId = waveId;
      preconf.waveletId = waveletId;
      preconf.rootBlipId = rootBlipId;
      return queueOp("wave.robot.createWavelet", {
             "waveletId": waveletId, 
             "waveletData": {
                "waveletId": waveletId, 
                "waveId": waveId, 
                "rootBlipId": rootBlipId, 
                "participants": participants
              }, 
              "waveId": waveId
              });
    }
    
  },
  wavelet:{
    appendBlip: function(content, parent, waveId, waveletId){
      var wavehost = username.replace(/^.+@/,'');
      var blipId =  "TBD_"+wavehost+"!conv+root_0x"+(Math.random()*9e5).toString(16);
      return queueOp('wave.wavelet.appendBlip', {waveletId: waveletId, waveId: waveId, blipId:blipId, "blipData": {"waveletId": waveletId, "blipId": blipId, "waveId": waveId, "content": content, "parentBlipId": parent}, parentBlipId: parent})
      
    },
    modifyParticipantRole: function(participant, role, waveId, waveletId){
      return queueOp('wave.wavelet.modifyParticipantRole', {waveletId: waveletId, waveId: waveId, participantId: participant, participantRole: role})
    },
    removeTag: function(tag, waveId, waveletId){
      return queueOp('wave.wavelet.modifyTag', {waveletId: waveletId, waveId: waveId, name: tag, modifyHow: 'remove'});
    },
    addTag: function(tag, waveId, waveletId){
      return queueOp('wave.wavelet.modifyTag', {waveletId: waveletId, waveId: waveId, name: tag});
    },
    
    setTitle: function(title, waveId, waveletId){
      return queueOp('wave.wavelet.setTitle', {waveletId: waveletId, waveId: waveId, waveletTitle: title});
    },
    participant: {
      add: function(participant, waveId, waveletId){
        return queueOp('wave.wavelet.participant.add', {waveId: waveId, waveletId: waveletId, participantId: participant});
      }
    }
  },
  document:{
    appendMarkup: function(content, blipId, waveId, waveletId){
      return queueOp('wave.document.appendMarkup', {waveletId: waveletId, waveId: waveId, blipId: blipId, content: content})
    },
    modify: function(modifyAction, blipId, waveId, waveletId){
      return queueOp('wave.document.modify', {waveletId: waveletId, waveId: waveId, blipId: blipId, modifyAction: modifyAction})
    },
    modify_range: function(modifyAction, start, end,  blipId, waveId, waveletId){
      return queueOp('wave.document.modify', {waveletId: waveletId, waveId: waveId, blipId: blipId, modifyAction: modifyAction, range: {start: start, end: end}})
    }
  },
  blip:{
    "delete": function(blipId, waveId, waveletId){
      return queueOp('wave.blip.delete', {waveletId: waveletId, waveId: waveId, blipId: blipId})
    },
    //this is actually pretty different from others, it's just a shortcut for another one
    "replace": function(content, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify({modifyHow: "REPLACE", values: ['\n'+content]}, blipId, waveId, waveletId)
    },
    "replace_range": function(content, start, end, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify_range({modifyHow: "REPLACE", values: [content]}, start, end, blipId, waveId, waveletId)
    },
    "update_element": function(properties, blipId, waveId, waveletId){

      return queueOp('wave.document.modify', {
        waveletId: waveletId, 
        waveId: waveId, 
        blipId: blipId, 
        modifyAction: {
          'modifyHow': 'UPDATE_ELEMENT',
          elements: [
            {'type': 'GADGET',
            properties: properties}
          ]
        },
        modifyQuery: {
          restrictions: {},
          maxRes: 1,
          elementMatch: "GADGET"
        }
      })
    },
    
    "insert": function(content, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify({modifyHow: "INSERT", values: ['\n'+content]}, blipId, waveId, waveletId)
    },
    "append": function(content, blipId, waveId, waveletId){
			content = clean_text(content);
      return wave.document.modify({modifyHow: "INSERT_AFTER", values: [content]}, blipId, waveId, waveletId)
    },

    createChild: function(parentBlipId, waveId, waveletId, blipId){
      return queueOp('wave.blip.createChild', {
        "waveletId": waveletId, "waveId": waveId, blipId: parentBlipId, 
        "blipData": {"waveletId": waveletId, "blipId": blipId, "waveId": waveId, "content": '', "parentBlipId": parentBlipId}
      })
    },
    continueThread: function(parentBlipId, waveId, waveletId, blipId){
      return queueOp('wave.blip.continueThread', {
        "waveletId": waveletId, "waveId": waveId, blipId: parentBlipId, 
        "blipData": {"waveletId": waveletId, "blipId": blipId, "waveId": waveId, "content": '', "parentBlipId": parentBlipId}
      })
    },
    contentCreateChild: function(content, parentBlipId, waveId, waveletId){
      var blipId = "TBD_"+waveletId+"_0x"+(Math.random()*9e5).toString(16);
      wave.blip.createChild(parentBlipId, waveId, waveletId, blipId);
      wave.blip.replace(content, blipId, waveId, waveletId);
    },
    contentContinueThread: function(content, parentBlipId, waveId, waveletId){
      var blipId = "TBD_"+waveletId+"_0x"+(Math.random()*9e5).toString(16);
      wave.blip.continueThread(parentBlipId, waveId, waveletId, blipId);
      wave.blip.replace(content, blipId, waveId, waveletId);
    }
  }
}

