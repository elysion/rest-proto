var sys = require('sys'),
    exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    sys.puts(stdout);
    console.log(error)
}

// -R  reporting 
// -t  timeout [ default: 2000 ]
exec('mocha -R spec -t 5000', puts);
