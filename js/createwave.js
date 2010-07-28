function create_wave(){
	window._gaq && _gaq.push(['_trackEvent', 'Wave', 'Create wave']);
  var loadID = loading("Creating wave...")
  setTimeout(function(){
    var xcf = {};
    callbacks[wave.robot.createWavelet([], xcf)] = function(json){
      loading(loadID);
      setTimeout(function(){
        hashHandler('wave:'+json.data.waveId, true);runQueue();
      },100)
    }
    var title = 'New Wave';
    //wave.blip.insert(content, xcf.rootBlipId, xcf.waveId, xcf.waveletId);
    wave.wavelet.setTitle(title, xcf.waveId, xcf.waveletId)
    runQueue();
  },500)
}
