import * as vscode from "vscode";
import { exec, ExecOptions } from "child_process";
import { isAbsolute } from "path";

function execute(command: string, input: string, cwd?: string) {
    return new Promise<string>((resolve, reject) => {
        const options = {
            cwd,
        };
        const child = exec(command, options, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });

        child.stdin?.write(input);
        child.stdin?.end();
    });
}

export type CommandOptions = {
    eyamlPath: string;
    basePath: string | undefined;
    publicKeyPath: string | undefined;
    privateKeyPath: string | undefined;
};

export type Command = (input: string, options: CommandOptions) => Promise<string>;

function resolvePath(path: string, basePath: string | undefined) {
    if (!isAbsolute(path) && basePath) {
        return vscode.Uri.joinPath(vscode.Uri.parse(basePath), path).fsPath;
    }

    return path;
}

export function encrypt(input: string, options: CommandOptions): Promise<string> {
    let command = `${options.eyamlPath} encrypt -o string --stdin`;
    if (options.publicKeyPath) {
        let publicKeyPath = resolvePath(options.publicKeyPath, options.basePath);
        command += ` --pkcs7-public-key ${publicKeyPath}`;
    }

    return execute(command, input, options.basePath);
}

export function decrypt(input: string, options: CommandOptions): Promise<string> {
    let command = `${options.eyamlPath} decrypt --stdin`;
    if (options.publicKeyPath) {
        let publicKeyPath = resolvePath(options.publicKeyPath, options.basePath);
        command += ` --pkcs7-public-key ${publicKeyPath}`;
    }

    if (options.privateKeyPath) {
        let privateKeyPath = resolvePath(options.privateKeyPath, options.basePath);
        command += ` --pkcs7-private-key ${privateKeyPath}`;
    }

    return execute(command, input, options.basePath);
}
