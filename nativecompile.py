#/usr/bin/python
import  httplib, urllib, fileinput, sys, re
print "Reading Developement HTML"
prefix = './'
codes = open(prefix+'native.html','r').read()
compile_regex = r'START_JS(.*?)END_JS'
js = ''
for match in re.finditer(compile_regex, codes, re.DOTALL):
		print "Found script compile block"
		includetext = match.group(1)
		for include in re.finditer(r'src=[\"\'](.*)[\"\']', includetext):
			fn = include.group(1)
			js += "//File: "+fn+ '\n\n\n'
			js +=  open(prefix+fn,'r').read() + '\n\n\n'
		html = codes.replace(match.group(0),'')

print "Writing concatenated JS"
open(prefix+'microwave.native.js','w').write(js)

#exit();

html = html.replace('<!--RELEASE','')
html = html.replace('RELEASE-->','')
html = html.replace('<!---->','')
print "Writing compiled HTML"
open(prefix+'native.out.html','w').write(html)

print "Querying Closure Compiler REST API for compressed JS"


params = urllib.urlencode([
    ('js_code', js),
    ('compilation_level', 'SIMPLE_OPTIMIZATIONS'),
    ('output_format', 'text'),
    ('output_info', 'compiled_code'),
  ])

# Always use the following value for the Content-type header.
headers = { "Content-type": "application/x-www-form-urlencoded" }
conn = httplib.HTTPConnection('closure-compiler.appspot.com')
conn.request('POST', '/compile', params, headers)
response = conn.getresponse()
data = response.read()#.replace('\n','')

print "Writing compressed JS"
open(prefix+'native.min.js','w').write(data)