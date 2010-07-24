
function addTouchScroll(){
    var TS_CSS = 'lib/touchscroll.css';
    var TS_JS = 'lib/touchscroll.min.js';
    var elements = arguments;
    var link = document.createElement('link');
    link.href = TS_CSS;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.body.appendChild(link);
    var script = document.createElement('script');
    script.src = TS_JS;
    script.onload = function(){
        setTimeout(function(){
            for(var i = 0; i < elements.length; i++){
                var el = elements[i];
                console.log(el);
                if(typeof(el) == "string") el = document.getElementById(el);
                new TouchScroll(el, {elastic: true});
            }
        },100)
    }
    document.body.appendChild(script)
} 

opt.x.touchscroll = "Add the TouchScroll library to do cool scrolly things on iPad Multipane"
if(opt.touchscroll){
  addTouchScroll('wave_container_parent', 'search_parent_container')
  document.getElementById('wave_container_parent').style.width = (innerWidth-300)+'px';
  document.getElementById('wave_container').style.width = (innerWidth-300)+'px';
}
