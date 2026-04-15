export type FileType = 'json' | 'xml' | 'yaml' | 'flat';

const xmlExtensions = ['xml', 'config'];

export const checkFileValidity = (filePath: string, type: FileType) => {
	const extension = getExtension(filePath).toLowerCase();

	switch (type) {
		case 'json':
			return extension === 'json';
		case 'xml':
			return xmlExtensions.includes(extension);
		case 'yaml':
			return extension === 'yaml' || extension === 'yml';
		default:
			return true;
	}
};

const getExtension = (fileName: string) => {
	const parts = fileName.split('.');
	return parts[parts.length - 1];
};
