const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const createMessageRoutes = require('./routes/message');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Membuat klien WhatsApp dengan LocalAuth untuk menyimpan sesi autentikasi secara lokal
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'SICAPIT' // Identifier sesi autentikasi
    }),
    webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
});

// Event untuk menampilkan QR code di terminal
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Event saat klien siap digunakan
client.on('ready', async () => {
    console.log('Server WhatsApp SICAPIT is ready!');

    try {
        // Mendapatkan semua chat
        const chats = await client.getChats();
        console.log('Chats:', chats);
        // Memfilter hanya grup
        const groups = chats.filter(chat => chat.isGroup);

        if (groups.length === 0) {
            console.log('Tidak ada grup yang ditemukan.');
        } else {
            console.log('Daftar Grup WhatsApp:');
            console.log('==============================');
            groups.forEach((chat, index) => {
                console.log(`\nGroup ${index + 1}:`);
                console.log(`  Nama Grup    : ${chat.name}`);
                console.log(`  Group ID     : ${chat.id._serialized}`);
                console.log('------------------------------');
            });
        }
    } catch (error) {
        console.error('Terjadi kesalahan saat mengambil grup:', error);
    }

    // Gunakan rute hanya setelah klien siap
    app.use('/api/messages', createMessageRoutes(client));
});

// Event saat autentikasi berhasil
client.on('authenticated', () => {
    console.log('Authenticated');
});

// Event saat autentikasi gagal
client.on('auth_failure', msg => {
    console.error('Authentication failure', msg);
});

// Event saat klien terputus
client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

// Inisialisasi klien WhatsApp
client.initialize();

// Menjalankan server pada port yang ditentukan
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
