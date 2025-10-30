type JWT = {
  aud: string[];
  email: string;
  exp: number;
  iat: number;
  nbf: number;
  iss: string;
  type: "app";
  identity_nonce: string;
  sub: string;
  country: string;
};
