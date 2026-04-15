import tl = require("azure-pipelines-task-lib/task");

import { readFileSync, writeFileSync } from "node:fs";
import { checkFileValidity, type FileType } from "./helpers/fileHelpers";
import transformFlatFile from "./transformations/flat";
import transformJson from "./transformations/json";
import transformXml, { type XmlTransformationMode } from "./transformations/xml";
import transformYaml from "./transformations/yaml";

type Inputs = {
	FileType: FileType;
	TargetPath: string;
	Transformations?: string;
	Separator?: "=" | ":";
	XmlTransformationMode?: XmlTransformationMode;
	XmlTransformationFilePath?: string;
};

async function run() {
	try {
		const inputs: Inputs = {
			FileType: tl.getInput("FileType", true) as FileType,
			TargetPath: tl.getInput("TargetPath", true) as string,
			Transformations: tl.getInput("Transformations", false) ?? undefined,
		};

		if (!tl.exist(inputs.TargetPath)) {
			throw new Error(`File not found: ${inputs.TargetPath}`);
		}

		if (!checkFileValidity(inputs.TargetPath, inputs.FileType)) {
			throw new Error(`Bad file format: ${inputs.FileType}`);
		}

		switch (inputs.FileType) {
			case "json": {
				const transformations = requireTransformations(inputs.Transformations);
				const targetJson = readFileSync(inputs.TargetPath, "utf8");
				const resultJson = transformJson(targetJson, transformations);
				writeFileSync(inputs.TargetPath, resultJson);
				break;
			}
			case "yaml": {
				const transformations = requireTransformations(inputs.Transformations);
				const targetYaml = readFileSync(inputs.TargetPath, "utf8");
				const resultYaml = transformYaml(targetYaml, transformations);
				writeFileSync(inputs.TargetPath, resultYaml);
				break;
			}
			case "flat": {
				const transformations = requireTransformations(inputs.Transformations);
				const separator = tl.getInput("Separator", true) as "=" | ":";
				const target = readFileSync(inputs.TargetPath, "utf8");
				const result = transformFlatFile(target, transformations, separator);
				writeFileSync(inputs.TargetPath, result);
				break;
			}
			case "xml": {
				const xmlTransformationMode =
					(tl.getInput("XmlTransformationMode", false) as XmlTransformationMode) ??
					"object";
				const targetXml = readFileSync(inputs.TargetPath, "utf8");

				let xmlTransformations = "";
				if (xmlTransformationMode === "xdtFile") {
					const xmlTransformationFilePath = tl.getInput(
						"XmlTransformationFilePath",
						true,
					) as string;

					if (!tl.exist(xmlTransformationFilePath)) {
						throw new Error(
							`XML transformation file not found: ${xmlTransformationFilePath}`,
						);
					}

					xmlTransformations = readFileSync(xmlTransformationFilePath, "utf8");
				} else {
					xmlTransformations = requireTransformations(inputs.Transformations);
				}

				const resultXml = transformXml(
					targetXml,
					xmlTransformations,
					xmlTransformationMode,
				);
				writeFileSync(inputs.TargetPath, resultXml);
				break;
			}
			default:
				throw new Error(`File type not supported: ${inputs.FileType}`);
		}

		tl.setResult(tl.TaskResult.Succeeded, `Transformed ${inputs.TargetPath}`);
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		tl.setResult(
			tl.TaskResult.Failed,
			`An error has occured during transformation - ${errorMessage}`,
		);
	}
}

function requireTransformations(transformations?: string) {
	if (!transformations || transformations.trim().length === 0) {
		throw new Error("Transformations input is required");
	}

	return transformations;
}

run();
