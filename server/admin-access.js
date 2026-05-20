import { timingSafeEqual } from 'node:crypto';

const normalizeCode = (value) => String(value ?? '').trim();

export const verifyAdminCode = (submittedCode, expectedCode) => {
  const expected = normalizeCode(expectedCode);
  const submitted = normalizeCode(submittedCode);

  if (!expected || !submitted || expected.length !== submitted.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(submitted));
};
