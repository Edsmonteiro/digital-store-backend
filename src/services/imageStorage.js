const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { ApiError } = require('../utils/errors');
const uploadsDirectory = path.join(__dirname, '..', '..', 'public', 'media');
const allowed = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function looksLikeImage(buffer, extension) {
  if (extension === 'jpg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === 'png') return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === 'webp') return buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}
async function saveImage({ type, content }, addedPaths) {
  if (typeof content !== 'string' || !content) throw new ApiError(400, 'Imagem sem conteúdo.');
  if (/^https:\/\//i.test(content)) {
    try { new URL(content); } catch { throw new ApiError(400, 'URL de imagem inválida.'); }
    if (content.length > 1000) throw new ApiError(400, 'URL de imagem muito longa.');
    return content;
  }
  // Reutilização de imagem que já pertence à aplicação (nunca permite caminho arbitrário).
  if (/^\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(content)) return content;
  const extension = allowed[type];
  if (!extension) throw new ApiError(400, 'Tipo de imagem inválido. Envie JPEG, PNG ou WebP.');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content)) {
    throw new ApiError(400, 'Base64 da imagem inválido.');
  }
  // Um limite de 8MB no JSON e 5MB por imagem impede gravações excessivas.
  const bytes = Buffer.from(content, 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || !looksLikeImage(bytes, extension)) {
    throw new ApiError(400, 'Imagem inválida ou maior que 5MB.');
  }
  await fs.mkdir(uploadsDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  const relativePath = `/media/${filename}`;
  await fs.writeFile(path.join(uploadsDirectory, filename), bytes, { flag: 'wx' });
  addedPaths.push(relativePath);
  return relativePath;
}
async function deleteImage(relativePath) {
  if (!/^\/media\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(relativePath || '')) return;
  await fs.rm(path.join(uploadsDirectory, path.basename(relativePath)), { force: true });
}
function publicUrl(imagePath, request) {
  if (/^https:\/\//i.test(imagePath)) return imagePath;
  const base = (process.env.PUBLIC_BASE_URL || `${request.protocol}://${request.get('host')}`).replace(/\/$/, '');
  return `${base}${imagePath}`;
}
module.exports = { saveImage, deleteImage, publicUrl, looksLikeImage };
