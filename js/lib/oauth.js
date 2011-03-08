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

function create_signature(){
  var nonce = Math.random().toString(36).substr(2,5),
    consumer_key = 'anonymous',
    consumer_secret = 'anonymous',
    token = oauth_key, 
    provider_secret = oauth_secret,
    timestamp = -~(new Date/1000),
    path = 'https://www-opensocial.googleusercontent.com/api/rpc',
    out = [], 
    param = {
			consumer_key: consumer_key,
			nonce: nonce,
			signature_method: 'HMAC-SHA1',
			timestamp: timestamp,
			token: token
		};
    
  for(var i in param) 
    out.push("oauth_"+i+"="+oauth_escape(param[i]));
  
	param.signature = b64_hmac_sha1(
		oauth_escape(consumer_secret) + "&" + oauth_escape(provider_secret), 
		['POST', oauth_escape(path), oauth_escape(out.join('&'))].join("&"));
		
  return param
}


function to_header(param){
	var out = [];
  for(var i in param)
    out.push("oauth_"+i+'="'+oauth_escape(param[i])+'"');
  return 'OAuth '+out.join(", ");
}

function to_url(param){
	var out = [];
	for(var i in param)
    out.push("oauth_"+i+"="+oauth_escape(param[i]));
  return out.join("&");
}


function oauth_escape(string){
  return encodeURIComponent(string).replace(/\!/g, "%21")
    .replace(/\*/g, "%2A").replace(/'/g, "%27") //'
    .replace(/\(/g, "%28").replace(/\)/g, "%29");
}


// heavily optimized and compressed version of http://pajhome.org.uk/crypt/md5/sha1.js
// _p = b64pad, _z = character size; not used here but I left them available just in case
    
function b64_hmac_sha1(k, d, _p, _z) {//last two are never called
  if(!_p) {
    _p = "="
  }
  if(!_z) {
    _z = 8
  }
  function _f(t, b, c, d) {
    if(t < 20) {
      return b & c | ~b & d
    }
    if(t < 40) {
      return b ^ c ^ d
    }
    if(t < 60) {
      return b & c | b & d | c & d
    }
    return b ^ c ^ d
  }
  function _k(t) {
    return t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? -1894007588 : -899497514
  }
  function _s(x, y) {
    var l = (x & 65535) + (y & 65535), m = (x >> 16) + (y >> 16) + (l >> 16);
    return m << 16 | l & 65535
  }
  function _r(n, c) {
    return n << c | n >>> 32 - c
  }
  function _c(x, l) {
    x[l >> 5] |= 128 << 24 - l % 32;
    x[(l + 64 >> 9 << 4) + 15] = l;
    var w = [80], a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;
    for(var i = 0;i < x.length;i += 16) {
      var o = a, p = b, q = c, r = d, s = e;
      for(var j = 0;j < 80;j++) {
        if(j < 16) {
          w[j] = x[i + j]
        }else {
          w[j] = _r(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1)
        }
        var t = _s(_s(_r(a, 5), _f(j, b, c, d)), _s(_s(e, w[j]), _k(j)));
        e = d;
        d = c;
        c = _r(b, 30);
        b = a;
        a = t
      }
      a = _s(a, o);
      b = _s(b, p);
      c = _s(c, q);
      d = _s(d, r);
      e = _s(e, s)
    }
    return[a, b, c, d, e]
  }
  function _b(s) {
    var b = [], m = (1 << _z) - 1;
    for(var i = 0;i < s.length * _z;i += _z) {
      b[i >> 5] |= (s.charCodeAt(i / 8) & m) << 32 - _z - i % 32
    }
    return b
  }
  function _h(k, d) {
    var b = _b(k);
    if(b.length > 16) {
      b = _c(b, k.length * _z)
    }
    var p = [16], o = [16];
    for(var i = 0;i < 16;i++) {
      p[i] = b[i] ^ 909522486;
      o[i] = b[i] ^ 1549556828
    }
    var h = _c(p.concat(_b(d)), 512 + d.length * _z);
    return _c(o.concat(h), 512 + 160)
  }
  function _n(b) {
    var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", s = "";
    for(var i = 0;i < b.length * 4;i += 3) {
      var r = (b[i >> 2] >> 8 * (3 - i % 4) & 255) << 16 | (b[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4) & 255) << 8 | b[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4) & 255;
      for(var j = 0;j < 4;j++) {
        if(i * 8 + j * 6 > b.length * 32) {
          s += _p
        }else {
          s += t.charAt(r >> 6 * (3 - j) & 63)
        }
      }
    }
    return s
  }
  function _x(k, d) {
    return _n(_h(k, d))
  }
  return _x(k, d)
}
;
