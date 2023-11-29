export type FileType = 'json' | 'xml' | 'yaml' | 'flat';

// TODO: add xml and flat file support
// TODO: check also based on content format
export const checkFileValidity = (filePath: string, type: FileType) => {
	switch (type) {
		case 'json':
			return getExtension(filePath) === 'json';
        case 'yaml':
            return getExtension(filePath) === 'yaml' || getExtension(filePath) === 'yml';
        default:
            return true;
	}
};

const getExtension = (fileName: string) => {
	const parts = fileName.split('.');
	return parts[parts.length - 1];
};
