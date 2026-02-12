const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require('pino');
const TelegramBot = require('node-telegram-bot-api');
const { Boom } = require('@hapi/boom');
const express = require('express');

// --- 🌐 WEB SERVER (Keep-Alive) ---
const app = express();
app.get('/', (req, res) => res.send('ADAM-AIRA V2 IS FULL POWER ⚡'));
app.listen(process.env.PORT || 3000);

// --- 🤖 CONFIG ---
const token = '8066622469:AAHfTl75LWgyhMVqvJ61RUH45MWOZJ9bU90'; 
const chatId = '7445393741'; 
const bot = new TelegramBot(token, { polling: true });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        // Update browser for better connection stability
        browser: ["Mac OS", "Chrome", "121.0.6167.184"]
    });

    // 📩 Pairing System
    bot.on('message', async (msg) => {
        const text = msg.text;
        if (text && text.startsWith('/pair')) {
            const num = text.split(' ')[1];
            if (!num) return bot.sendMessage(msg.chat.id, "❌ Use: `/pair 91xxx`", { parse_mode: 'Markdown' });
            
            try {
                bot.sendMessage(msg.chat.id, "⏳ *Generating Pairing Code...*", { parse_mode: 'Markdown' });
                // Clean the number
                let phoneNumber = num.replace(/[^0-9]/g, '');
                let code = await sock.requestPairingCode(phoneNumber);
                bot.sendMessage(msg.chat.id, `⚡ *AIRA V2 CODE:* \n\n \`${code}\` \n\nEnter this in WhatsApp now!`, { parse_mode: 'Markdown' });
            } catch (e) {
                console.log(e);
                bot.sendMessage(msg.chat.id, "❌ Error! Render Clear Build cheythu restart cheyyu.");
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            bot.sendMessage(chatId, "✅ *Adam-Aira V2 Connected!* \nInni ninte WhatsApp-il ninnu .menu adikkam!");
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
        
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const cmd = body.toLowerCase().trim();

        // Commands (Ninte number-il ninnum work aakum)
        if (cmd === '.menu') {
            await sock.sendMessage(from, { text: "⚡ *ADAM-AIRA V2 MENU* ⚡\n\n💥 .bug\n🚀 .ping\n🔥 .alive" });
        }
        if (cmd === '.ping') {
            await sock.sendMessage(from, { text: "🚀 *Aira Speed:* 10ms" });
        }
        if (cmd === '.bug') {
            await sock.sendMessage(from, { text: "🛠️ *BUG MENU*\n\n1. .amigo\n2. .aira\n3. .infinity" });
        }
        if (cmd === '.amigo') await sock.sendMessage(from, { text: "ॣ".repeat(25000) });
        if (cmd === '.aira') await sock.sendMessage(from, { text: "ॣ".repeat(50000) });
        if (cmd === '.infinity') await sock.sendMessage(from, { text: "ॣ".repeat(80000) });
    });
}

startBot();
