var sys = require('sys'),
    exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    sys.puts(stdout);
}

exec('npm install forever -g"', puts);
