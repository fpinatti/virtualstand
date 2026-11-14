module.exports = {
  documentDirectory: '/data/user/0/com.virtualstand/files/',
  cacheDirectory: '/data/user/0/com.virtualstand/cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue({ uri: '/data/user/0/com.virtualstand/files/covers/13_thumb.jpg' }),
};

