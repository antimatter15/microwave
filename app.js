db = window.openDatabase("app", "", "my app db name", 1024*1024);
db.transaction(function(tx) {    
  tx.executeSql("CREATE TABLE IF NOT EXISTS storage (id TEXT, text TEXT)");
});

retrieve = function(id, callback){
  db.transaction(function(tx){
    tx.executeSql('SELECT * FROM storage WHERE id = ?', [id], function (tx, results) {
      results.rows.items(0)
    })
  })
}

set = function(id, value){
  tx.executeSql('INSERT INTO storage (id, text) values (?, ?)', [id, value]);
}
