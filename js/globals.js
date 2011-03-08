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

if(!window.console) console = {log: function(){}};

function getEl(id){return document.getElementById(id)}

var screen_size = (document.documentElement.clientWidth||innerWidth), small_screen = (screen_size<500);
var loadIds = {};
var current_search = '';
var searchLastIndex = 0;
var edit_box, edit_text;
var search_container = getEl('search_container');
var wave_container = getEl('wave_container');
var mobilewebkit = navigator.userAgent.indexOf("WebKit") != -1 && navigator.userAgent.indexOf("Mobile")!=-1;
var current_wave = "";
var current_wavelet = "";
var auto_reload = false;
var lasthash = 'chunkybacon';
var current_page = 0; //0 = search, 1 = wave
var search_outdated = false;
var searchscroll = 0;
var scrollto_position = -1;


if(mobilewebkit) document.body.className += ' mobilewebkit'; //yeah i know browser detection is bad, but how do i get around it here? 

if(!window.onLine) window.onLine = function(){return true};


