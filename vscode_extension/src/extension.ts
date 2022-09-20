// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as child from 'child_process';
import * as vscode from 'vscode';

async function llm_request(llm: child.ChildProcess, document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken): Promise<vscode.InlineCompletionItem[]> {
	if (token.isCancellationRequested) {
		return new Promise<vscode.InlineCompletionItem[]>((_, reject) => {
			reject();
		});
	} else {
		// const line = document.lineAt(position.line).text;
		const line = document.getText(new vscode.Range(position.with(undefined, 0), position));
		if (line.replaceAll("/", "").trim().length === 0 || 
			line.trim().length === 0 ) {
			return new Promise<vscode.InlineCompletionItem[]>((_, reject) => {
				reject();
			});
		}

		console.log("extension -> llm: write request ", line);

		// newline is required to flush the stdin to the server
		const need_flush = llm.stdin!.write(line + "\n", (error) => {
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
					if (token.isCancellationRequested) {
						console.log("extension: cancelled");
						reject();
						return;
					}
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
						reject();
						return;
					}
				});
			}
		);
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('extension is loaded');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	const llm_file = '/Users/vineethyeevani/Documents/llm_code_autocomplete/prediction_engine/dist/main';
	const llm: child.ChildProcess = child.spawn(llm_file);

	console.log(llm);

	console.log("Spawned llm");

	// We need to serialize the requests to the llm 
	// so that we aren't conflicting with the existing
	// requests that were made
	// We will use the promises to handle the asynchronous
	// request. This will ensure that only once a request
	// has completed will we be allowed to continue onwards
	let first_request = true;
	let requests_promise: Promise<vscode.InlineCompletionItem[]>;
	const provider = {
		async provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken) {
			if (first_request) {
				requests_promise = llm_request(llm, document, position, context, token);
				first_request = false;
			} else {
				console.log("extension: chain request");
				// requests_promise = requests_promise.finally(() => {
				// 	return llm_request(llm, document, position, context, token);
				// });
				requests_promise = requests_promise.then((_) => {
					return llm_request(llm, document, position, context, token);
				}, (_) => {
					return llm_request(llm, document, position, context, token);
				});
			}
			console.log(requests_promise);
			return requests_promise;
		}
	};

	vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, provider);

	context.subscriptions.push(disposable);
}
