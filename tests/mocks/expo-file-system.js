module.exports = {
  documentDirectory: '/data/user/0/com.virtualstand/files/',
  cacheDirectory: '/data/user/0/com.virtualstand/cache/',
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
  getInfoAsync: jest.fn().mockResolvedValue({
    exists: false,
    size: 102400,
    md5: 'd41d8cd98f00b204e9800998ecf8427e',
  }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('JVBERi0='),
  getFreeDiskStorageAsync: jest.fn().mockResolvedValue(1024 * 1024 * 500),
  downloadAsync: jest.fn().mockResolvedValue({
    uri: '/data/user/0/com.virtualstand/files/covers/13_thumb.jpg',
    status: 200,
  }),
  createDownloadResumable: jest.fn((url, fileUri, _options, callback) => ({
    downloadAsync: jest.fn(async () => {
      if (callback) {
        callback({ totalBytesWritten: 50000, totalBytesExpectedToWrite: 100000 });
        callback({ totalBytesWritten: 100000, totalBytesExpectedToWrite: 100000 });
      }
      return { uri: fileUri, status: 200 };
    }),
    pauseAsync: jest.fn().mockResolvedValue(undefined),
  })),
};
