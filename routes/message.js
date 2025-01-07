const express = require('express');
const multer = require('multer');
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const router = express.Router();

// Konfigurasi Multer untuk menyimpan file dengan ekstensi yang benar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});

// Validasi jenis file
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and DOC files are allowed.'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Batas ukuran file 5MB
});

// Ekspor fungsi yang menerima client sebagai argumen
module.exports = (client) => {
    // Kirim pesan ke nomor tertentu
    router.post('/send', async (req, res) => {
        const { number, message } = req.body;

        try {
            let sanitized_number;
            if (number.endsWith('@s.whatsapp.net')) {
                sanitized_number = number.replace('@s.whatsapp.net', '');
            } else {
                sanitized_number = number;
            }
            sanitized_number = sanitized_number.replace(/^0/, '62') + '@c.us';

            // Verifikasi Nomer Valid/Tidak Valid
            const numberExists = await client.getNumberId(sanitized_number);
            if (!numberExists) {
                return res.status(400).json({ status: 'Error', message: `Nomor ${number} tidak valid. Mohon perbarui nomor HP Anda.` });
            } else {
                // Kirim Pesan
                if (!/^\d+$/.test(number) && !number.endsWith('@s.whatsapp.net') && !number.endsWith('@c.us')) {
                    return res.status(400).json({ status: 'Error', message: 'No HP mengandung huruf bukan angka. Mohon perbarui No HP Anda.' });
                } else {
                    await client.sendMessage(sanitized_number, message);
                    res.status(200).json({ status: 'Message sent' });
                    console.log('Pengiriman pesan berhasil:', `${number}`);
                }
            }
        } catch (error) {
            console.error('Error sending message:', `Gagal mengirim pesan pada nomor ${number}`);
            if (error.message.includes('invalid wid')) {
                res.status(400).json({ status: 'Error', message: `Nomor HP mengandung karakter bukan angka. Mohon perbarui nomor HP Anda.` });
            } else {
                res.status(500).json({ status: 'Error', message: 'Internal Server Error' });
            }
        }
    });

    // Kirim gambar atau dokumen
    router.post('/send-media', upload.single('file'), async (req, res) => {
        const { number, caption } = req.body;
        const file = req.file;
    
        if (!file) {
            return res.status(400).json({ status: 'Error', message: 'No file uploaded' });
        }

        try {
            let sanitized_number;
            if (number.endsWith('@s.whatsapp.net')) {
                sanitized_number = number.replace('@s.whatsapp.net', '');
            } else {
                sanitized_number = number;
            }
            sanitized_number = sanitized_number.replace(/^0/, '62') + '@c.us';

            // Verifikasi Nomer Valid/Tidak Valid
            const numberExists = await client.getNumberId(sanitized_number);
            if (!numberExists) {
                return res.status(400).json({ status: 'Error', message: `Nomor ${number} tidak valid. Mohon perbarui nomor HP Anda.` });
            } else {
                // Kirim Pesan
                if (!/^\d+$/.test(number) && !number.endsWith('@s.whatsapp.net') && !number.endsWith('@c.us')) {
                    return res.status(400).json({ status: 'Error', message: 'No HP mengandung huruf bukan angka. Mohon perbarui No HP Anda.' });
                } else {
                    const media = MessageMedia.fromFilePath(file.path);
                    await client.sendMessage(sanitized_number, media, { caption: caption || '' });
                    res.status(200).json({ status: 'Media message sent' });
                    console.log('Pengiriman media pesan berhasil:', `${number}`);
                }
            }
        } catch (error) {
            console.error('Error sending media message:', `Gagal mengirim pesan pada nomor ${number}`);
            if (error.message.includes('invalid wid')) {
                res.status(400).json({ status: 'Error', message: `Nomor HP mengandung karakter bukan angka. Mohon perbarui nomor HP Anda.` });
            } else {
                res.status(500).json({ status: 'Error', message: 'Internal Server Error' });
            }
        }
    });

    router.post('/send-group', async (req, res) => {
        const { groupId, message } = req.body;

        try {
            // Pastikan ID grup valid (groupId harus berakhiran dengan @g.us)
            if (!groupId.endsWith('@g.us')) {
                return res.status(400).json({ status: 'Error', message: 'Group ID tidak valid. Format ID grup yang benar adalah [groupid@g.us].' });
            }

            // Kirim pesan ke grup
            await client.sendMessage(groupId, message);
            res.status(200).json({ status: 'Message sent to group' });
            console.log('Pengiriman pesan grup berhasil:', `${groupId}`);

        } catch (error) {
            console.error('Error sending group message:', `Gagal mengirim pesan ke grup ${groupId}`);
            res.status(500).json({ status: 'Error', message: 'Internal Server Error' });
        }
    });
    
    
    return router;
};
