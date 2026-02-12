const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require('pino');
const TelegramBot = require('node-telegram-bot-api');
const { Boom } = require('@hapi/boom');
const express = require('express');

// --- 🌐 WEB SERVER FOR RENDER (Keep Alive) ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Adam-Aira Bot is Running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// --- 🤖 ADAM'S CONFIG ---
const token = '7949274696:AAGAIDs8QKvgKvomU7bhyrPtBWRSgWoVHB8'; 
const chatId = '7445393741'; 
const bot = new TelegramBot(token, { polling: true });

async function startAira() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false 
    });

    // 📩 Telegram Pairing System
    bot.onText(/\/pair (.+)/, async (msg, match) => {
        if (msg.chat.id.toString() !== chatId) return;
        const phoneNumber = match[1].replace(/[^0-9]/g, ''); 
        
        try {
            const msgInfo = await bot.sendMessage(chatId, `⏳ *Generating Code for ${phoneNumber}...*`, { parse_mode: 'Markdown' });
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            
            await bot.editMessageText(`⚡ *ADAM-AIRA CODE:* \n\n \`${code}\` \n\nEnter this in WhatsApp Linked Devices!`, {
                chat_id: chatId,
                message_id: msgInfo.message_id,
                parse_mode: 'Markdown'
            });
        } catch (e) { 
            bot.sendMessage(chatId, "❌ Error! Try again later.");
        }
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            await bot.sendMessage(chatId, '✅ *Adam-Aira Connected!* \nBot is now 24/7 on Render! 😈', { parse_mode: 'Markdown' });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startAira();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase().trim();

        if (text === '.menu') {
            await sock.sendMessage(from, { text: "╭━━〔 ⚡ ADAM-AIRA ⚡ 〕━━┈\n┃\n┃ ⚡ .ping\n┃ 💥 .bug\n┃\n╰━━━━━━━━━━━━━━━┈" });
        }
        if (text === '.ping') await sock.sendMessage(from, { text: "🚀 *Bot Speed:* Hyper Active!" });

        // --- 💥 BUG SYSTEM ---
        if (text === '.bug') {
            await sock.sendMessage(from, { text: "╭━━〔 🛠️ BUG MENU 〕━━┈\n┃\n┃ 🔘 .amigo\n┃ 🔘 .aira\n┃ 🔘 .infinity\n┃\n╰━━━━━━━━━━━━━━━┈" });
        }
        if (text === '.amigo') await sock.sendMessage(from, { text: "ॣ".repeat(40000) });
        if (text === '.aira') await sock.sendMessage(from, { text: "ॣ".repeat(70000) });
        if (text === '.infinity') await sock.sendMessage(from, { text: "ॣ".repeat(100000) });
    });
}

startAira();

