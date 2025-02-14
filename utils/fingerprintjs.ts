let fingerprint = '';

export async function getFingerprint() {
  // TODO: 测试代码
  if (import.meta.dev) {
    return fingerprint || import('@cmtlyt/base')
      .then(({ getRandomString }) => {
        return fingerprint = getRandomString(16);
      });
  }
  if (import.meta.client) {
    return fingerprint || import('@fingerprintjs/fingerprintjs')
      .then(FingerprintJS => FingerprintJS.load())
      .then(fp => fp.get())
      .then((result) => {
        return fingerprint = result.visitorId;
      });
  }
  return '';
}
