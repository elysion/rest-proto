var sys = require('sys'),
    exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    sys.puts(stdout);
}

exec('sudo rm /var/lib/mongodb/mongod.lock', puts);
exec('sudo -u mongodb mongod --repair --dbpath /var/lib/mongodb/', puts);
exec('sudo service mongodb start', puts);
