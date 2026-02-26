import { CompleteMultipartUploadCommandOutput, AbortMultipartUploadCommandOutput } from "@aws-sdk/client-s3";

export function datestring() {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0'); // month is 0-based
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function isUploadCompleted(output: CompleteMultipartUploadCommandOutput | AbortMultipartUploadCommandOutput): output is CompleteMultipartUploadCommandOutput {
  return (output as CompleteMultipartUploadCommandOutput).ETag !== undefined;
}
