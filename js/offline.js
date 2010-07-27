function searchStyle(waveId){
  if(cacheState[waveId] == 2){
    return 'fresh_cache';
  }else if(cacheState[waveId] == 1){
    return 'old_cache';
  }
  return '';
}

function onLine(){
	var val = navigator.onLine;
	//var val = false;
	if(val == false){
		document.getElementById('offline_head').style.display = '';
		document.getElementById('online_head').style.display = 'none'
	}
	return val;
}


var cachequeue = [];
function open_db(){
if(!window.db)
		window.db = openDatabase('waves', '1.0', 'Offline Wave Cache', 5 * 1024 * 1024);
}
function offline_cache(){
  if(onLine() == false) return;
  open_db();
  db.transaction(function(tx){
		tx.executeSql("DROP TABLE inbox");
  })
  callbacks[wave.robot.search('in:inbox',0,42)] = function(msg){
    var item, digests = msg.data.searchResults.digests;
    for(var i = 0; i < digests.length; i++){
      item = digests[i];
      cachequeue.push(item);
	  
	  console.log(item.waveId)
    }
	setTimeout(cache_cycle, 1000);
  }
  runQueue();
}

var cacheState = {}; //0 = uncached, 1 = cached but outdated, 2 = cached and new
try{
	if(window.localStorage && localStorage.cacheState){
		var cs = JSON.parse(localStorage.cacheState);
		for(var i = 0; i < cs.length; i++){
			cacheState[cs[i]] = 1;
		}
		//cacheState = JSON.parse(localStorage.cacheState)
	}
}catch(err){}



function cache_cycle(){
  var citem = null;
  if(citem = cachequeue.shift()){
	console.log("caching wave" + citem.waveId);
    callbacks[wave.robot.fetchWave(citem.waveId, citem.waveId.replace(/w\+.+/g,'conv+root'))] = function(data){
	  console.log('acquired data for' + citem.waveId);
      db.transaction(function (tx) {
		console.log('fetched wave' + citem.waveId);
        tx.executeSql('CREATE TABLE IF NOT EXISTS inbox (waveid, result, data, date)');
        tx.executeSql('DELETE FROM inbox WHERE waveid = ?', [citem.waveId], function(tx, results){
          tx.executeSql('INSERT INTO inbox (waveid, result, data, date) VALUES (?, ?, ?, ?)', [citem.waveId, JSON.stringify(citem), JSON.stringify(data), new Date - 0], function(){
		  console.log("done caching wave" + citem.waveId);
            if(document.getElementById(citem.waveId))
				document.getElementById(citem.waveId).className = "search fresh_cache";
            cacheState[citem.waveId] = 2;
			var cs = [];
			for(var i in cacheState){
				cs.push(i);
			}
			localStorage.cacheState = JSON.stringify(cs);
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
