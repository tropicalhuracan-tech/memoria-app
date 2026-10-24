export interface SafePhoto {
  id: string;
  title: string;
  note: string;
  /** Imagen cifrada (AES-GCM) en base64 */
  cipherImage: string;
  createdAt: string;
}

export interface SafeSharePayload {
  v: 1;
  title: string;
  note: string;
  imageCipher: string;
}
