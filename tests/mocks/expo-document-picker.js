module.exports = {
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: '/data/user/0/com.virtualstand/cache/DocumentPicker/catan-rules.pdf',
        name: 'catan-rules.pdf',
        size: 102400,
        mimeType: 'application/pdf',
      },
    ],
  }),
};

