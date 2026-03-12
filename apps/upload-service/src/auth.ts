import * as jwt from 'jsonwebtoken';

const PRIVATE_KEY = "foobar";
const PUBLIC_KEY = "barfoo";

export function createToken(projectId: string): string {
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + 864000; // ten days
  const privateKey: string = PRIVATE_KEY;

  const claims = {
    'sub': PUBLIC_KEY,
    'project_id': projectId,
    'exp': expirationTime
  };

  return jwt.sign(claims, privateKey, { algorithm: "HS256" });
}

export function verifyToken(token: string, projectId: string): boolean {
  const claims = jwt.verify(token, PRIVATE_KEY, { algorithms: ["HS256"], complete: false });

  return (claims as jwt.JwtPayload)['project_id'] === projectId;
}
