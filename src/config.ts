import { WorkspaceConfiguration } from "vscode";

export type ExtensionConfig = {
    eyamlPath: string;
    outputFormat: string;
    outputBlockMaxLength: number;
    publicKeyPath?: string;
    privateKeyPath?: string;
};

export function loadAndValidateConfig(config: WorkspaceConfiguration): ExtensionConfig {
    return {
        eyamlPath: config.get("eyamlPath") ?? "eyaml",
        outputFormat: config.get("outputFormat") ?? "block",
        outputBlockMaxLength: config.get("outputBlockMaxLength") ?? 64,
        publicKeyPath: config.get("publicKeyPath"),
        privateKeyPath: config.get("privateKeyPath"),
    };
}
