#!/usr/bin/env node --harmony


var program = require('commander');
var prompt = require('co-prompt');
var co = require('co');
var request = require('superagent');
var figlet = require('figlet');
var chalk = require('chalk');
var clear = require('clear');
var fs = require('fs');
var ProgressBar = require('progress');

clear();
console.log(
  chalk.red(
    figlet.textSync('Bitbucket', { horizontalLayout: 'full' })
  )
);

program
	.version('0.0.1')
	.arguments('<file> ')
	.option('-u, --username <username>', 'The user to authenticate as')
	.option('-p, --password <password>', 'The user\'s password')
	.option('-b, --browser', 'Open the snippet in the system browser')
	.action(function(file){
		co(function *(){
			var username = yield prompt(chalk.green('username: '));
			var password = yield prompt.password(chalk.green('password: '));
			// console.log('user: %s pass: %s file: %s',
			// username, password, file);

			var lastSlash = file.lastIndexOf('/');
	        var filename = lastSlash === -1 ? file : file.substring(lastSlash);

	        var fileSize = fs.statSync(file).size;
	        var fileStream = fs.createReadStream(file);

	        var barOpts = {
	          width: 20,
	          total: fileSize,
	          clear: true
	        };
	        var bar = new ProgressBar(' uploading [:bar] :percent :etas', barOpts);
	        fileStream.on('data', function (chunk) {
	          bar.tick(chunk.length);
        });

		request
			.post('https://api.bitbucket.org/2.0/snippets/')
			.auth(username, password)
			.attach('file', fileStream)
			.set('Accept', 'application/json')
			.end(function (err, res){
				if(!err && res.ok){
					var link = res.body.links.html.href;
					console.log('Snippets created: %s', link);
					process.exit(0);
				}

				var errorMessage;
				if(res && res.status === 401){
					errorMessage = "Authentication failed! Wrong username or password!";
				}
				else if(err){
					errorMessage = res.text;
				}
				console.error(errorMessage);
				process.exit(1);
			});
		});
	});

	program.parse(process.argv);


	