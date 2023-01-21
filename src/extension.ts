import * as vscode from "vscode";
import { CommandOptions, decrypt, encrypt } from "./commands";
import { loadAndValidateConfig } from "./config";

enum Action {
    Encrypt = "encrypt",
    Decrypt = "decrypt",
}

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("Hiera Eyaml");

    context.subscriptions.push(
        vscode.commands.registerCommand("eyaml.encrypt", () => execute(Action.Encrypt))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("eyaml.decrypt", () => execute(Action.Decrypt))
    );
}

function getActiveWorkspaceFolder(editor: vscode.TextEditor): vscode.WorkspaceFolder | undefined {
    return vscode.workspace.getWorkspaceFolder(editor.document.uri);
}

function getTabSize(editor: vscode.TextEditor): number {
    let editorTabSize = editor.options.tabSize;

    if (typeof editorTabSize === "number") {
        return editorTabSize;
    }

    return 2;
}

function getLineSeparator(editor: vscode.TextEditor): string {
    if (editor.document.eol === vscode.EndOfLine.CRLF) {
        return "\r\n";
    }

    return "\n";
}

type FormatOptions = {
    format: string;
    maxLength: number;
    lineSeparator: string;
    tabSize: number;
};

function formatOutput(output: string, pos: number, options: FormatOptions) {
    if (options.format === "block") {
        let formatted = ">";

        for (let i = 0; i < output.length; i += options.maxLength) {
            formatted += options.lineSeparator;
            formatted += " ".repeat(pos + options.tabSize);
            formatted += output.substring(i, i + options.maxLength);
        }

        return formatted;
    }

    return output;
}

async function execute(action: Action) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    editor.document.eol;
    const selection = editor.selection;

    const text = editor.document.getText(selection);
    if (!text) {
        return;
    }

    const config = loadAndValidateConfig(vscode.workspace.getConfiguration("hiera-eyaml-crypt"));

    const options: CommandOptions = {
        eyamlPath: config.eyamlPath,
        publicKeyPath: config.publicKeyPath,
        privateKeyPath: config.privateKeyPath,
        basePath: getActiveWorkspaceFolder(editor)?.uri.fsPath,
    };

    try {
        if (action == Action.Encrypt) {
            const output = await encrypt(text, options);

            const start = editor.document.lineAt(selection.start.line).firstNonWhitespaceCharacterIndex;

            const formatted = formatOutput(output, start, {
                format: config.outputFormat,
                maxLength: config.outputBlockMaxLength,
                lineSeparator: getLineSeparator(editor),
                tabSize: getTabSize(editor),
            });

            editor.edit((builder) => builder.replace(selection, formatted));
        } else if (action === Action.Decrypt) {
            const output = await decrypt(text, options);

            editor.edit((builder) => builder.replace(selection, output));
        }
    } catch (err) {
        vscode.window.showErrorMessage(
            `Action '${action}' failed, check Hiera Eyaml output for more details`
        );
        outputChannel.appendLine(`${err}`);
    }
}
