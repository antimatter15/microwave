//localStorage on iOS isn't always persistent, but Web SQL is.
;(function(w){
	if(!w.localStorage && w.openDatabase){
		var cachedStorage = {};
		var ordered = [];
		var db = openDatabase('_localStorage', '1.0', 'Because iOS localStorage doesnt always persist', 1024*512, function(db){
			db.transaction(function(tx){
				tx.executeSql('CREATE TABLE IF NOT EXISTS data(ID INTEGER PRIMARY KEY ASC, key TEXT, value TEXT)')
				tx.executeSql('SELECT * FROM data', [], function(tx, rs){
					for(var i = 0; i < rs.rows.length; i++){
						var item = rs.rows.item(i);
						ordered.push(item.key);
						cachedStorage[item.key] = item.value;
					}
				});
			});
		});
		var store = {
			getItem: function(key){
				return cachedStorage[key]
			},
			setItem: function(key, val){
				tx.executeSql('INSERT INTO data(key, value) VALUES (?,?)', [key, val]);
				cachedStorage[key] = val;
			},
			removeItem: function(key){
				tx.executeSql('DELETE FROM data WHERE key=?', [key]);
				delete cachedStorage[key];
				ordered.splice(ordered.indexOf(key), 1);
			},
			key: function(index){
				return ordered[index]
			}
		}
		store.__defineGetter__('length',function(){
			return ordered.length;
		})
	}
})(this);
