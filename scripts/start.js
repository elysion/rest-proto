var sys = require('sys'),
    exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    sys.puts(stdout);
}

// Input parameters: [ nodeBinary, script, arg0, arg1, ... ]
process.argv.slice(2).forEach(function (arg) {
    if (arg == "deploy") {
        exec('forever stopall"', puts);
        exec('forever start ../app.js"', puts);
    } else {
        exec('node ../app.js"', puts);
    }
});
