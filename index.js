const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const TelegramBot = require('node-telegram-bot-api');
const { Boom } = require('@hapi/boom');
const express = require('express');

// --- 🌐 WEB SERVER (Keep-Alive) ---
const app = express();
app.get('/', (req, res) => res.send('ADAM-AIRA V2 IS ONLINE ⚡'));
app.listen(process.env.PORT || 3000);

// --- 🤖 CONFIG ---
// Ninte puthiya token ivide update cheythittundu
const token = '8007564638:AAGSTpxW7R9iHH8tgYUddUab_CQdq5uMfdU'; 
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
        // Windows Chrome browser setting to bypass "Couldn't Link" error
        browser: ["Windows", "Chrome", "10.0.0"]
    });

    // 📩 Pairing System with Delay Logic
    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        if (text && text.startsWith('/pair')) {
            const num = text.split(' ')[1];
            if (!num) return bot.sendMessage(chatId, "❌ Use: `/pair 91xxx`", { parse_mode: 'Markdown' });
            
            try {
                bot.sendMessage(chatId, "⏳ *Generating Pairing Code...*", { parse_mode: 'Markdown' });
                
                let phoneNumber = num.replace(/[^0-9]/g, '');
                
                // 3-second delay to ensure connection is ready
                setTimeout(async () => {
                    try {
                        let code = await sock.requestPairingCode(phoneNumber);
                        bot.sendMessage(chatId, `⚡ *AIRA V2 CODE:* \n\n \`${code}\` \n\nEnter this in WhatsApp now!`, { parse_mode: 'Markdown' });
                    } catch (err) {
                        console.log(err);
                        bot.sendMessage(chatId, "❌ Error! Render 'Clear Build' cheythu restart cheyyu.");
                    }
                }, 3000);

            } catch (e) {
                console.log(e);
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ WhatsApp Connected!");
            bot.sendMessage(bot.options.chatId || '7445393741', "✅ *Adam-Aira V2 Connected!* \nInni .menu adikkam!");
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

        // Simple Commands
        if (cmd === '.menu') {
            await sock.sendMessage(from, { text: "⚡ *ADAM-AIRA V2 MENU* ⚡\n\n🚀 .ping\n🔥 .alive\n🛠️ .bug" });
        }
        if (cmd === '.ping') {
            await sock.sendMessage(from, { text: "🚀 *Aira Speed:* Online" });
        }
    });
}

console.log("⚡ ADAM-AIRA V2 STARTING...");
startBot();
