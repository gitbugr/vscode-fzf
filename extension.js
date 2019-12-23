const vscode = require('vscode');
const debounce = require('debounce');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('extension.fzf', function () {
		const quickPick = vscode.window.createQuickPick();

		const { spawn } = require('child_process');
		let ag = false;

		const updateResults = (e) => {
			try {
				if (ag) {
					ag.kill();
				}
				quickPick.items = [];
						
				if (vscode.workspace.workspaceFolders.length) {
					const cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
					// not sure why the f this isn't working
					ag = spawn('rg', ['--vimgrep', e.replace(/ /g, '\\ ')], { shell:true , cwd: cwd});
					let stream = '';
					let index = 0;
					ag.stdout.on('data', (data) => {
						quickPick.busy = true;
						stream += data;
						let endOfLine = stream.indexOf('\n');
						let line = '';
						while (endOfLine > -1) {
							line = stream.substring(0, endOfLine);
							stream = stream.substring(endOfLine + 1);
							const match = line.match(/^([^:]+):(\d)+:(\d)+:(.*)/);
							if (match) {
								quickPick.items = quickPick.items.concat([{
									id: index,
									label: match[1].substring(match[1].lastIndexOf('/')),
									line: match[2],
									column: match[3],
									description: `${match[2]}:${match[3]}`,
									detail: `${match[4].trim()}`,
								}]);
							} else {
								console.log(line, cwd);
							}
							endOfLine = stream.indexOf('\n');
							index++;
						}
						quickPick.busy = false;
					});
				}
			} catch (e) {
				console.log(`something went wrong.. ${e}`);
			}
		};

		quickPick.onDidChangeValue(debounce(updateResults, 500));

		quickPick.onDidChangeActive((e) => {
			//console.log(e);
		});

		quickPick.show();
	});
	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
