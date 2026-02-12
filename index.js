const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require('pino');
const TelegramBot = require('node-telegram-bot-api');
const { Boom } = require('@hapi/boom');
const express = require('express');

// --- 🌐 WEB SERVER ---
const app = express();
app.get('/', (req, res) => res.send('ADAM-AIRA V2 ONLINE ⚡'));
app.listen(process.env.PORT || 3000);

// --- 🤖 CONFIG (Ninte Puthiya Token) ---
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
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // 📩 Pairing System
    bot.on('message', async (msg) => {
        const text = msg.text;
        if (text && text.startsWith('/pair')) {
            const num = text.split(' ')[1];
            if (!num) return bot.sendMessage(msg.chat.id, "❌ Use: `/pair 91xxx`", { parse_mode: 'Markdown' });
            
            try {
                bot.sendMessage(msg.chat.id, "⏳ *Generating Code...*", { parse_mode: 'Markdown' });
                let code = await sock.requestPairingCode(num.replace(/[^0-9]/g, ''));
                bot.sendMessage(msg.chat.id, `⚡ *YOUR PAIRING CODE:* \n\n \`${code}\``, { parse_mode: 'Markdown' });
            } catch (e) {
                bot.sendMessage(msg.chat.id, "❌ Error! Render onnu Restart cheyyu.");
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') bot.sendMessage(chatId, "✅ *Adam-Aira V2 Connected!* \nInni ninte WhatsApp-il ninnu .menu adikkam!");
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message) return;
        
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const cmd = body.toLowerCase().trim();

        if (cmd === '.menu') {
            await sock.sendMessage(from, { text: "⚡ *ADAM-AIRA V2* ⚡\n\n💥 .bug\n🚀 .ping\n🔥 .alive" });
        }
        if (cmd === '.bug') {
            await sock.sendMessage(from, { text: "🛠️ *BUG MENU*\n\n1. .amigo\n2. .aira\n3. .infinity" });
        }
        if (cmd === '.amigo') await sock.sendMessage(from, { text: "ॣ".repeat(30000) });
        if (cmd === '.aira') await sock.sendMessage(from, { text: "ॣ".repeat(60000) });
        if (cmd === '.infinity') await sock.sendMessage(from, { text: "ॣ".repeat(90000) });
    });
}

startBot();
