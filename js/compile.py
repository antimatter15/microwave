#/usr/bin/python
import  httplib, urllib, fileinput, sys, re
print "Reading Developement HTML"
codes = open('../dev.html','r').read()
compile_regex = r'START_JS(.*?)END_JS'
js = ''
for match in re.finditer(compile_regex, codes, re.DOTALL):
		print "Found script compile block"
		includetext = match.group(1)
		for include in re.finditer(r'src=[\"\'](.*)[\"\']', includetext):
			fn = include.group(1)
			js += "//File: "+fn+ '\n\n\n'
			js +=  open('../'+fn,'r').read() + '\n\n\n'


print "Writing concatenated JS"
open('../microwave.all.js','w').write(js)


print "Querying Closure Compiler REST API for compressed JS"
html = re.sub(compile_regex, '<script type="text/javascript" src="microwave.min.js"></script>', codes)
html = html.replace('<!--RELEASE','')
html = html.replace('RELEASE-->','')
print "Writing compiled HTML"
open('../ui.html','w').write(html)


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
open('../microwave.min.js','w').write(data)