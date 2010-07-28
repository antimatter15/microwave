function searchStyle(waveId){
  if(cacheState[waveId] == 2){
    return 'fresh_cache';
  }else if(cacheState[waveId] == 1){
    return 'old_cache';
  }
  return '';
}

function onLine(){
	var val;
	if(opt.force_offline){
		val = true;
	}else if(navigator.onLine === undefined){
		val = true;
	}else{
		val = navigator.onLine;
	}
	if(val == false){
		var last_update = (+new Date - parseInt(localStorage.getItem('cache_last_updated')))/1000;
		if(!isNaN(last_update)){
			var status = '';
			if(last_update < 60) status = 'less than a minute';
			else if(last_update < 60*60) status = Math.ceil(last_update/60)+' minutes';
			else if(last_update < 60*60*24) status = Math.ceil(last_update/60/60)+' hours';
			else status = Math.ceil(last_update/60/60/24)+' days';
			document.getElementById('offline_status').value = 'Offline (Cache '+status+' old)';
		}
	}
	return val;
}


var cachequeue = [], db = null;
function open_db(){
	if(!window.db && window.openDatabase){
		window.db = openDatabase('waves', '1.0', 'Offline Wave Cache', 1024 * 1024);
	}
}

function offline_cache(){
  if(onLine() == false) return;
  open_db();
  if(!window.db) return;
  db.transaction(function(tx){
		tx.executeSql("DROP TABLE inbox");
  })
  localStorage.setItem('cache_last_updated', +new Date);
  callbacks[wave.robot.search('in:inbox',0,42)] = function(msg){
    var item, digests = msg.data.searchResults.digests;
    for(var i = 0; i < digests.length; i++){
      item = digests[i];
      cachequeue.push(item);
    }
		setTimeout(cache_cycle, 1000);
  }
  runQueue();
}

var cacheState = {}; //0 = uncached, 1 = cached but outdated, 2 = cached and new
try{
	if(window.localStorage && localStorage.cacheState){
		var cs = JSON.parse(localStorage.getItem('cacheState'));
		for(var i = 0; i < cs.length; i++){
			cacheState[cs[i]] = 1;
		}
	}
}catch(err){}



function cache_cycle(){
	if(!window.db) return;
  var citem = null;
  if(citem = cachequeue.shift()){
	//console.log("caching wave" + citem.waveId);
    callbacks[wave.robot.fetchWave(citem.waveId, citem.waveId.replace(/w\+.+/g,'conv+root'))] = function(data){
	  //console.log('acquired data for' + citem.waveId);
      db.transaction(function (tx) {
		//console.log('fetched wave' + citem.waveId);
        tx.executeSql('CREATE TABLE IF NOT EXISTS inbox (waveid, result, data, date)');
        tx.executeSql('DELETE FROM inbox WHERE waveid = ?', [citem.waveId], function(tx, results){
          tx.executeSql('INSERT INTO inbox (waveid, result, data, date) VALUES (?, ?, ?, ?)', [citem.waveId, JSON.stringify(citem), JSON.stringify(data), new Date - 0], function(){
		  //console.log("done caching wave" + citem.waveId);
            if(document.getElementById(citem.waveId))
				document.getElementById(citem.waveId).className = "search fresh_cache";
            cacheState[citem.waveId] = 2;
			var cs = [];
			for(var i in cacheState){
				cs.push(i);
			}
			
			localStorage.setItem('cacheState', JSON.stringify(cs));
      setTimeout(cache_cycle, 1000);
    });

        });
      });
	  return true;
    }
	runQueue();
  }
}

function resultClass(waveId){
	if(!cacheState[waveId]){
		return '';
	}else if(cacheState[waveId] == 1){
		return 'old_cache'
	}else if(cacheState[waveId] == 2){
		return 'fresh_cache';
	}
}
