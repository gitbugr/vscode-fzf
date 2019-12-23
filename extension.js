const vscode = require('vscode');
const debounce = require('debounce');

let ag = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('extension.fzf', function () {
		const quickPick = vscode.window.createQuickPick();

		const { spawn } = require('child_process');
		let cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
		
		if (ag !== false) {
			ag.kill();
		}
		let stream = '';
		let index = 0;
		let setNotBusy = setTimeout(()=>{}, 500);

		const updateResults = (data) => {
			clearTimeout(setNotBusy);
			quickPick.busy = true;
			stream += data.toString();
			let endOfLine = stream.indexOf('\n');
			let line = '';
			while (endOfLine > -1) {
				line = stream.substring(0, endOfLine);
				stream = stream.substring(endOfLine + 1);
				const match = line.match(/^([^:]+):(\d)+:(\d)+:(.*)/);
				if (match) {
					quickPick.items = quickPick.items.concat([{
						id: index,
						detail: match[1].substring(match[1].lastIndexOf('/')),
						line: match[2],
						column: match[3],
						description: `${match[2]}:${match[3]}`,
						label: `${match[4].trim()}`,
					}]);
				} else {
					// console.log(line, cwd);
				}
				endOfLine = stream.indexOf('\n');
				index++;
				setNotBusy = setTimeout(()=>{
					quickPick.busy = false;
				}, 500);
			}
		}

		const spawnAg = (e) => {
			try {
				quickPick.items = [];
				if (typeof cwd !== 'undefined') {
					ag = spawn('rg', ['--vimgrep', `"${e.toString()}"`], { shell:true, cwd: cwd });
					ag.stdout.on('data', updateResults);
				}
			} catch (e) {
				console.log(`something went wrong.. ${e}`);
			}
		};

		quickPick.onDidChangeValue(debounce(spawnAg, 500));

		quickPick.onDidChangeActive((e) => {
			// console.log(e);
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
