import {
	DOMParser,
	XMLSerializer,
	type Attr,
	type Document,
	type Element,
} from "@xmldom/xmldom";
import transformJson from "./json";

type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonObject
	| JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const XDT_NAMESPACE = "http://schemas.microsoft.com/XML-Document-Transform";
const XML_DECLARATION_PATTERN = /^\uFEFF?\s*(<\?xml[\s\S]*?\?>)/;

type XdtTransformName =
	| "Insert"
	| "InsertIfMissing"
	| "Remove"
	| "RemoveAll"
	| "RemoveAttributes"
	| "Replace"
	| "SetAttributes";

type ParsedXdtTransform = {
	name: XdtTransformName;
	arguments: string[];
};

type ParsedXdtLocator =
	| { type: "default" }
	| { type: "match"; attributes: string[] };

export type XmlTransformationMode = "object" | "xdtInline" | "xdtFile";

export default function transformXml(
	targetXml: string,
	transformations: string,
	mode: XmlTransformationMode = "object",
) {
	switch (mode) {
		case "object":
			return transformXmlObject(targetXml, transformations);
		case "xdtInline":
		case "xdtFile":
			return transformXmlWithXdt(targetXml, transformations);
		default:
			throw new Error(`Unsupported XML transformation mode: ${mode}`);
	}
}

function transformXmlObject(targetXml: string, transformations: string) {
	const xmlDeclaration = extractXmlDeclaration(targetXml);
	const targetDocument = parseXmlDocument(targetXml, "target XML");
	const transformableTarget = JSON.stringify(xmlDocumentToObject(targetDocument));
	const transformedTarget = transformJson(transformableTarget, transformations);
	const transformedDocument = xmlObjectToDocument(
		JSON.parse(transformedTarget) as JsonObject,
	);

	return serializeXmlDocument(transformedDocument, xmlDeclaration);
}

function transformXmlWithXdt(targetXml: string, xdtXml: string) {
	const xmlDeclaration = extractXmlDeclaration(targetXml);
	const targetDocument = parseXmlDocument(targetXml, "target XML");
	const transformDocument = parseXmlDocument(xdtXml, "XDT XML");
	const targetRoot = requireDocumentElement(targetDocument, "target XML");
	const transformRoot = requireDocumentElement(transformDocument, "XDT XML");

	if (targetRoot.tagName !== transformRoot.tagName) {
		throw new Error(
			`XDT root element <${transformRoot.tagName}> does not match target root <${targetRoot.tagName}>`,
		);
	}

	applyXdtChildren(targetDocument, targetRoot, transformRoot);

	return serializeXmlDocument(targetDocument, xmlDeclaration);
}

function applyXdtChildren(
	targetDocument: Document,
	targetParent: Element,
	transformParent: Element,
) {
	const transformChildren = getChildElements(transformParent);

	for (const transformChild of transformChildren) {
		const parsedTransform = parseXdtTransform(transformChild);
		const parsedLocator = parseXdtLocator(transformChild);
		const matchingElements = findMatchingChildren(
			targetParent,
			transformChild,
			parsedLocator,
		);

		if (!parsedTransform) {
			if (matchingElements.length === 0) {
				throw new Error(`No matching XML node found for <${transformChild.tagName}>`);
			}

			for (const matchingElement of matchingElements) {
				applyXdtChildren(targetDocument, matchingElement, transformChild);
			}
			continue;
		}

		applyXdtTransform(
			targetDocument,
			targetParent,
			transformChild,
			matchingElements,
			parsedTransform,
		);
	}
}

function applyXdtTransform(
	targetDocument: Document,
	targetParent: Element,
	transformElement: Element,
	matchingElements: Element[],
	transform: ParsedXdtTransform,
) {
	switch (transform.name) {
		case "Insert":
			targetParent.appendChild(cloneWithoutXdt(targetDocument, transformElement));
			return;
		case "InsertIfMissing":
			if (matchingElements.length === 0) {
				targetParent.appendChild(cloneWithoutXdt(targetDocument, transformElement));
			}
			return;
		case "Remove":
			if (matchingElements[0]) {
				targetParent.removeChild(matchingElements[0]);
				return;
			}
			throw new Error(`No matching XML node found for Remove on <${transformElement.tagName}>`);
		case "RemoveAll":
			if (matchingElements.length === 0) {
				throw new Error(
					`No matching XML nodes found for RemoveAll on <${transformElement.tagName}>`,
				);
			}

			for (const matchingElement of matchingElements) {
				targetParent.removeChild(matchingElement);
			}
			return;
		case "Replace":
			if (matchingElements[0]) {
				targetParent.replaceChild(
					cloneWithoutXdt(targetDocument, transformElement),
					matchingElements[0],
				);
				return;
			}
			throw new Error(
				`No matching XML node found for Replace on <${transformElement.tagName}>`,
			);
		case "SetAttributes":
			if (matchingElements.length === 0) {
				throw new Error(
					`No matching XML node found for SetAttributes on <${transformElement.tagName}>`,
				);
			}

			for (const matchingElement of matchingElements) {
				const attributesToSet = getNonXdtAttributes(transformElement).filter(attribute =>
					transform.arguments.length === 0 ||
					transform.arguments.includes(attribute.name),
				);

				for (const attribute of attributesToSet) {
					matchingElement.setAttribute(attribute.name, attribute.value);
				}
			}
			return;
		case "RemoveAttributes":
			if (matchingElements.length === 0) {
				throw new Error(
					`No matching XML node found for RemoveAttributes on <${transformElement.tagName}>`,
				);
			}

			for (const matchingElement of matchingElements) {
				for (const attributeName of transform.arguments) {
					matchingElement.removeAttribute(attributeName);
				}
			}
			return;
		default:
			throw new Error(`Unsupported XDT transform: ${transform.name}`);
	}
}

function parseXdtTransform(element: Element): ParsedXdtTransform | undefined {
	const rawTransform = getXdtAttribute(element, "Transform");
	if (!rawTransform) {
		return undefined;
	}

	const match = rawTransform.match(/^([A-Za-z]+)(?:\((.*)\))?$/);
	if (!match) {
		throw new Error(`Unsupported XDT transform syntax: ${rawTransform}`);
	}

	const [, transformName, rawArguments] = match;
	const supportedTransforms: XdtTransformName[] = [
		"Insert",
		"InsertIfMissing",
		"Remove",
		"RemoveAll",
		"RemoveAttributes",
		"Replace",
		"SetAttributes",
	];

	if (!supportedTransforms.includes(transformName as XdtTransformName)) {
		throw new Error(`Unsupported XDT transform: ${transformName}`);
	}

	return {
		name: transformName as XdtTransformName,
		arguments: rawArguments
			? rawArguments
					.split(",")
					.map(argument => argument.trim())
					.filter(Boolean)
			: [],
	};
}

function parseXdtLocator(element: Element): ParsedXdtLocator {
	const rawLocator = getXdtAttribute(element, "Locator");
	if (!rawLocator) {
		return { type: "default" };
	}

	const match = rawLocator.match(/^Match\((.*)\)$/);
	if (!match) {
		throw new Error(`Unsupported XDT locator: ${rawLocator}`);
	}

	const attributes = match[1]
		.split(",")
		.map(attribute => attribute.trim())
		.filter(Boolean);

	if (attributes.length === 0) {
		throw new Error(`Unsupported XDT locator: ${rawLocator}`);
	}

	return {
		type: "match",
		attributes,
	};
}

function findMatchingChildren(
	targetParent: Element,
	transformElement: Element,
	locator: ParsedXdtLocator,
) {
	const candidates = getChildElements(targetParent).filter(
		element => element.tagName === transformElement.tagName,
	);

	if (locator.type === "default") {
		return candidates.length > 0 ? [candidates[0]] : [];
	}

	return candidates.filter(candidate =>
		locator.attributes.every(
			attributeName =>
				candidate.getAttribute(attributeName) ===
				transformElement.getAttribute(attributeName),
		),
	);
}

function cloneWithoutXdt(targetDocument: Document, sourceElement: Element) {
	const clonedElement = targetDocument.createElement(sourceElement.tagName);

	for (const attribute of getNonXdtAttributes(sourceElement)) {
		clonedElement.setAttribute(attribute.name, attribute.value);
	}

	for (const childNode of Array.from(sourceElement.childNodes)) {
		switch (childNode.nodeType) {
			case childNode.ELEMENT_NODE:
				clonedElement.appendChild(
					cloneWithoutXdt(targetDocument, childNode as Element),
				);
				break;
			case childNode.TEXT_NODE:
				clonedElement.appendChild(
					targetDocument.createTextNode(childNode.nodeValue ?? ""),
				);
				break;
			case childNode.CDATA_SECTION_NODE:
				clonedElement.appendChild(
					targetDocument.createCDATASection(childNode.nodeValue ?? ""),
				);
				break;
			case childNode.COMMENT_NODE:
				clonedElement.appendChild(
					targetDocument.createComment(childNode.nodeValue ?? ""),
				);
				break;
		}
	}

	return clonedElement;
}

function xmlDocumentToObject(document: Document): JsonObject {
	const rootElement = requireDocumentElement(document, "target XML");

	return {
		[rootElement.tagName]: elementToJsonValue(rootElement),
	};
}

function elementToJsonValue(element: Element): JsonValue {
	const childElements = getChildElements(element);
	const attributes = Array.from(element.attributes);
	const hasAttributes = attributes.length > 0;

	if (!hasAttributes && childElements.length === 0) {
		return getElementTextContent(element);
	}

	const result: JsonObject = {};

	for (const attribute of attributes) {
		result[`@${attribute.name}`] = attribute.value;
	}

	const textContent = getElementTextContent(element);
	if (textContent.length > 0) {
		result["#text"] = textContent;
	}

	for (const childElement of childElements) {
		const childValue = elementToJsonValue(childElement);
		const existingValue = result[childElement.tagName];

		if (existingValue === undefined) {
			result[childElement.tagName] = childValue;
			continue;
		}

		if (Array.isArray(existingValue)) {
			existingValue.push(childValue);
			continue;
		}

		result[childElement.tagName] = [existingValue, childValue];
	}

	return result;
}

function xmlObjectToDocument(xmlObject: JsonObject) {
	const rootEntries = Object.entries(xmlObject);
	if (rootEntries.length !== 1) {
		throw new Error("XML transform object must contain exactly one root element");
	}

	const [rootName, rootValue] = rootEntries[0];
	const document = new DOMParser().parseFromString("<placeholder />", "text/xml");
	const rootElement = document.createElement(rootName);
	const currentRootElement = requireDocumentElement(document, "generated XML");
	document.replaceChild(rootElement, currentRootElement);
	appendJsonValueToElement(document, rootElement, rootValue);

	return document;
}

function appendJsonValueToElement(
	document: Document,
	element: Element,
	value: JsonValue,
) {
	if (value === null) {
		return;
	}

	if (typeof value !== "object") {
		element.appendChild(document.createTextNode(String(value)));
		return;
	}

	if (Array.isArray(value)) {
		throw new Error("XML root nodes cannot be arrays");
	}

	for (const [key, childValue] of Object.entries(value)) {
		if (key.startsWith("@")) {
			element.setAttribute(key.slice(1), stringifyXmlValue(childValue));
			continue;
		}

		if (key === "#text") {
			element.appendChild(document.createTextNode(stringifyXmlValue(childValue)));
			continue;
		}

		if (Array.isArray(childValue)) {
			for (const arrayValue of childValue) {
				const childElement = document.createElement(key);
				appendJsonValueToElement(document, childElement, arrayValue);
				element.appendChild(childElement);
			}
			continue;
		}

		const childElement = document.createElement(key);
		appendJsonValueToElement(document, childElement, childValue);
		element.appendChild(childElement);
	}
}

function stringifyXmlValue(value: JsonValue) {
	if (
		typeof value === "object" &&
		value !== null
	) {
		throw new Error("XML attribute and text values must be primitive values");
	}

	return value === null ? "" : String(value);
}

function parseXmlDocument(xml: string, sourceDescription: string) {
	const parserErrors: string[] = [];
	const parser = new DOMParser({
		onError: (level, message) => {
			if (level !== "warning") {
				parserErrors.push(message);
			}
		},
	});
	const document = parser.parseFromString(removeBom(xml), "text/xml");

	if (parserErrors.length > 0 || !document.documentElement) {
		throw new Error(`Failed to parse ${sourceDescription}: ${parserErrors.join("; ")}`);
	}

	return document;
}

function serializeXmlDocument(document: Document, xmlDeclaration?: string) {
	const serializedDocument = new XMLSerializer().serializeToString(document);
	return xmlDeclaration
		? `${xmlDeclaration}${serializedDocument.startsWith("<?xml") ? "" : "\n"}${serializedDocument.replace(XML_DECLARATION_PATTERN, "")}`
		: serializedDocument;
}

function extractXmlDeclaration(xml: string) {
	return removeBom(xml).match(XML_DECLARATION_PATTERN)?.[1];
}

function requireDocumentElement(document: Document, sourceDescription: string) {
	if (!document.documentElement) {
		throw new Error(`Failed to parse ${sourceDescription}: missing document element`);
	}

	return document.documentElement;
}

function getElementTextContent(element: Element) {
	if (getChildElements(element).length > 0) {
		return Array.from(element.childNodes)
			.filter(
				childNode =>
					(childNode.nodeType === childNode.TEXT_NODE ||
						childNode.nodeType === childNode.CDATA_SECTION_NODE) &&
					(childNode.nodeValue ?? "").trim().length > 0,
			)
			.map(childNode => childNode.nodeValue ?? "")
			.join("");
	}

	return Array.from(element.childNodes)
		.filter(
			childNode =>
				childNode.nodeType === childNode.TEXT_NODE ||
				childNode.nodeType === childNode.CDATA_SECTION_NODE,
		)
		.map(childNode => childNode.nodeValue ?? "")
		.join("");
}

function getChildElements(element: Element) {
	return Array.from(element.childNodes).filter(
		(childNode): childNode is Element =>
			childNode.nodeType === childNode.ELEMENT_NODE,
	);
}

function getXdtAttribute(element: Element, attributeName: string) {
	return (
		element.getAttributeNS(XDT_NAMESPACE, attributeName) ??
		element.getAttribute(`xdt:${attributeName}`) ??
		undefined
	);
}

function getNonXdtAttributes(element: Element) {
	return Array.from(element.attributes).filter(attribute => !isXdtAttribute(attribute));
}

function isXdtAttribute(attribute: Attr) {
	return (
		attribute.namespaceURI === XDT_NAMESPACE ||
		(attribute.prefix === "xmlns" && attribute.localName === "xdt") ||
		attribute.name === "xmlns:xdt"
	);
}

function removeBom(str: string) {
	if (str.charCodeAt(0) === 0xfeff) {
		return str.slice(1);
	}

	return str;
}
