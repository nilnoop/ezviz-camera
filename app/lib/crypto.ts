export async function encryptPasswordWithPublicKey(
	password: string,
	publicKeyBase64: string,
) {
	const key = await window.crypto.subtle.importKey(
		"spki",
		base64ToArrayBuffer(publicKeyBase64),
		{
			name: "RSA-OAEP",
			hash: "SHA-256",
		},
		false,
		["encrypt"],
	);

	const encrypted = await window.crypto.subtle.encrypt(
		{ name: "RSA-OAEP" },
		key,
		new TextEncoder().encode(password),
	);

	return arrayBufferToBase64(encrypted);
}

function base64ToArrayBuffer(value: string) {
	const binary = window.atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return window.btoa(binary);
}
