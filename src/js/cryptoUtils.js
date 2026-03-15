const SALT = new Uint8Array([0x1A, 0x2B, 0x3C, 0x4D, 0x5E, 0x6F, 0x77, 0x88, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x11]);
const IV = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90, 0xAB, 0xCD, 0xEF, 0x11, 0x22, 0x33, 0x44]);

async function encryptText(text, password) {
    try {
        if (!text) return "";

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: SALT,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: IV
            },
            key,
            new TextEncoder().encode(text)
        );

        return encodeURIComponent(arrayBufferToBase64(encryptedData));
    } catch (error) {
        console.error('Ошибка шифрования:', error);
        return "";
    }
}

async function decryptText(encryptedURI, password) {
    try {
        if (!encryptedURI) return "";

        const base64 = decodeURIComponent(encryptedURI.trim());
        
        if (!/^[A-Za-z0-9+/=-]+$/.test(base64)) {
            throw new Error("Некорректный Base64");
        }

        const encryptedData = base64ToArrayBuffer(base64);

        if (encryptedData.byteLength < 16) {
            throw new Error("Данные слишком короткие");
        }

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: SALT,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: IV
            },
            key,
            encryptedData
        );

        return new TextDecoder().decode(decryptedData);
    } catch (error) {
        console.error('Ошибка дешифрования:', error);
        return "";
    }
}

function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64) {
    const cleanedBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
    const binaryString = atob(cleanedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}