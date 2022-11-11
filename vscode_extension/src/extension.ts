// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as child from 'child_process';
import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { setFlagsFromString } from 'v8';
import { request } from 'http';
import tcpPortUsed from 'tcp-port-used';

async function llm_request(llm: child.ChildProcess, document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken): Promise<vscode.InlineCompletionItem[]> {
	if (token.isCancellationRequested) {
		return new Promise<vscode.InlineCompletionItem[]>((_, reject) => {
			reject();
		});
	} else {
		// This will fetch all code in this document from the top
		const line = document.getText(new vscode.Range(position.with(0, 0), position));

		console.log("extension -> llm: write request ", line);

		// newline is required to flush the stdin to the server
		const need_flush = llm.stdin!.write(line + "<eor>" + "\n", (error) => {
			if (error != null) {
				console.log("extension -> llm: write error ", error);
			}
		});

		console.log("extension: need flush: ", need_flush);

		console.log("extension -> llm: write completed");

		return new Promise<vscode.InlineCompletionItem[]>(
			(resolve, reject) => {
				console.log("extension: starting read");
				llm.stdout?.once("data", (data) => {
					const llm_output = data.toString();
					try {
						const suggestions: vscode.InlineCompletionItem[] = [];
						const suggestion = llm_output;
						console.log("llm -> extension: ", suggestion);

						// const range = new vscode.Range(position, position.translate(0, suggestion.length));
						// suggestions.push(new vscode.InlineCompletionItem(suggestion, range));
						suggestions.push(new vscode.InlineCompletionItem(suggestion));
						console.log(suggestions);
						resolve(suggestions);
						return;
					} catch(e) {
						console.log("extension: failed to parse server output");
						resolve([]);
						return;
					}
				});
			}
		);
	}
}

// // this method is called when your extension is activated
// // your extension is activated the very first time the command is executed
// export async function activate(context: vscode.ExtensionContext) {
// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('extension is loaded');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	const disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed

// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World!');
// 	});

// 	const llm_file = '/Users/vineethyeevani/Documents/llm_code_autocomplete/prediction_engine/dist/main';
// 	const llm: child.ChildProcess = child.spawn(llm_file);

// 	llm.stderr?.pipe(process.stderr);

// 	llm.on('exit', () => {
// 		console.log("process closed");
// 	});

// 	console.log(llm);

// 	console.log("Spawned llm");

// 	// We need to serialize the requests to the llm 
// 	// so that we aren't conflicting with the existing
// 	// requests that were made
// 	// We will use the promises to handle the asynchronous
// 	// request. This will ensure that only once a request
// 	// has completed will we be allowed to continue onwards
// 	let first_request = true;
// 	let requests_promise: Promise<vscode.InlineCompletionItem[]>;
// 	const provider = {
// 		async provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken) {
// 			if (first_request) {
// 				requests_promise = llm_request(llm, document, position, context, token);
// 				first_request = false;
// 			} else {
// 				console.log("extension: chain request");
// 				requests_promise = requests_promise.then((_) => {
// 					return llm_request(llm, document, position, context, token);
// 				}, (_) => {
// 					return llm_request(llm, document, position, context, token);
// 				});
// 			}
// 			console.log(requests_promise);
// 			return requests_promise;
// 		}
// 	};

// 	vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider);

// 	context.subscriptions.push(disposable);
// }

/*
Desired user experience:
When the user has some charecters on the current line, suggestions for the next word
start to appear. The suggestions continue to grow until the user has selected what
they want to appear. 
*/

// export async function activate(context: vscode.ExtensionContext) {
// 	const llm: child.ChildProcess = child.spawn("python", ["/Users/vineethyeevani/Documents/llm_code_autocomplete/prediction_engine/main.py"]);

// 	console.log(llm);

// 	llm.stderr?.pipe(process.stderr);
// 	llm.stdout?.pipe(process.stdout);

// 	llm.on('exit', () => {
// 		console.log("process closed");
// 	});

	// const decoration_type = vscode.window.createTextEditorDecorationType({
	// 	// borderWidth: '10px',
	// 	// borderStyle: 'solid',
	// 	// overviewRulerColor: 'blue',
	// 	fontStyle: "italic",
	// 	// overviewRulerLane: vscode.OverviewRulerLane.Right,
	// 	// light: {
	// 	// 	// this color will be used in light color themes
	// 	// 	borderColor: 'darkblue'
	// 	// },
	// 	// dark: {
	// 	// 	// this color will be used in dark color themes
	// 	// 	borderColor: 'lightblue'
	// 	// }
	// });
	// setInterval(() => {
	// 	const activeEditor = vscode.window.activeTextEditor!;
	// 	const position = activeEditor.selection.active;

	// 	const selection = activeEditor.selection;
	// 	console.log(selection.anchor, selection.active);

	// 	if (!selection.anchor.isEqual(selection.active)) {
	// 		const document = activeEditor.document;

	// 		// Get the word within the selection
	// 		const selection_range = new vscode.Range(selection.anchor, selection.active);
	// 		console.log(selection_range);
	// 		const word = document.getText(selection_range);
	// 		const reversed = word.split('').reverse().join('');
	// 		activeEditor.edit(editBuilder => {
	// 			editBuilder.replace(selection, reversed);
	// 		});

	// 		activeEditor.setDecorations(decoration_type, [selection_range]);
	// 	} else {
	// 		console.log("Not selected");
	// 	}
	// }, 2000);

	// setTimeout(async () => {
	// 	console.log("sending request");
	// 	const response = await fetch('http://localhost:5000/');
	// 	console.log("sendoing request");
	// 	const text = await response.text();
	// 	console.log(text);
	// }, 1000);


// 	return;
// }

class LargeLanguageModel {
	llm_process: child.ChildProcess;
	constructor() {
		this.llm_process = child.spawn("python", ["/Users/vineethyeevani/Documents/llm_code_autocomplete/prediction_engine/main.py"]);
		// Route the I/O from the child process to visual studio code output
		this.llm_process.stderr?.pipe(process.stderr);
		this.llm_process.stdout?.pipe(process.stdout);

		// Register exit notification
		this.llm_process.on('exit', () => {
			console.log("process closed");
		});
	}

	// Going to try to send a single request and get multiple responses back
	async request(context: string) {
		tcpPortUsed.waitUntilUsed(5000, 500, 5000)
			.then(async function() {
				const response = await fetch('http://localhost:5000/?request='+context);
				try {
					for await (const chunk of response.body) {
						console.log(chunk.toString());
					}
				} catch (err) {
					console.error(err);
				}
			}, function(err: Error) {
				console.log('Error:', err.message);
			});

	}
}

export async function activate(context: vscode.ExtensionContext) {
	// Spawn the child process

	const llm = new LargeLanguageModel();

	setTimeout(async () => {
		llm.request("");
	}, 1000);
	
	// const provider = {
	// 	async provideInlineCompletionItems(
	// 		document: vscode.TextDocument, 
	// 		position: vscode.Position, 
	// 		context: vscode.InlineCompletionContext, 
	// 		token: vscode.CancellationToken) {
	// 			// Everytime a new completion request happens, we need to inform
	// 			// the llm_process that the user has done something and that the
	// 			// suggestions need to be refreshed
	// 		}
			

	// return;
}