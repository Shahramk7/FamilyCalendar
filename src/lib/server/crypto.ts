import type { TokenSet } from '$lib/types';

/**
 * Derives a CryptoKey from the raw base64 encryption key stored in Worker secrets.
 */
async function getKey(rawKey: string): Promise<CryptoKey> {
	const keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
	return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
		'encrypt',
		'decrypt'
	]);
}

/**
 * Encrypts a TokenSet using AES-256-GCM.
 * Returns base64-encoded ciphertext and IV.
 */
export async function encryptTokens(
	tokens: TokenSet,
	rawKey: string
): Promise<{ ciphertext: string; iv: string }> {
	const key = await getKey(rawKey);
	const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
	const plaintext = new TextEncoder().encode(JSON.stringify(tokens));

	const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

	return {
		ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
		iv: btoa(String.fromCharCode(...iv))
	};
}

/**
 * Decrypts a base64-encoded ciphertext back into a TokenSet.
 */
export async function decryptTokens(
	ciphertext: string,
	iv: string,
	rawKey: string
): Promise<TokenSet> {
	const key = await getKey(rawKey);
	const ciphertextBytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
	const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

	const decrypted = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: ivBytes },
		key,
		ciphertextBytes
	);

	return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Generate a new 256-bit encryption key (run once during setup).
 * Usage: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
 */
export function generateKeyInstructions(): string {
	return 'Run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"';
}
