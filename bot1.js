import dotenv from 'dotenv';
dotenv.config();
import { db } from './config.js';

import { Telegraf, Markup } from 'telegraf';
import { createAccounts, updatePrivateKeys, checkCreateUser, GetInfoUser,export_keys,getAllUsers} from './database/database.js';
import { checkBalenceUser ,transferAllSOL, transferSOL} from './handlers/CheckBalance.js';
import { send_sols } from './handlers/TransferSol.js';
const bot = new Telegraf(process.env.BOT_TOKEN);
const bot1 = new Telegraf(process.env.BOT_TOKEN1);
import LocalSession from "telegraf-session-local";
import moment from "moment";
import { PublicKey } from '@solana/web3.js';

const session = new LocalSession({ database: "session_db.json" }); // Lưu session vào file JSON
bot1.use(session.middleware()); // Sử dụng middleware session
async function Menu1(ctx) {
    const userId = ctx.from.id.toString();
    const hasAccount = await checkCreateUser(userId);
    console.log("User has account:", hasAccount);
    console.log("UserId:", userId);

    // Tạo danh sách nút
    let buttons = [
      
        [
            Markup.button.callback("💰 💳 Get Full User", "Get_fulluser"),
            // Markup.button.callback("📤 💸 Send SOL", "send_sol")
        ],
    ]

    await ctx.reply("🚀 PHANTHUYENBOT: Your Gateway to Solana DeFi 🤖", Markup.inlineKeyboard(buttons));
}
bot1.start(async (ctx) => {
    await Menu1(ctx);
    // await checkDatabase();
});
bot1.action("Get_fulluser", async (ctx) => {
    try {
        const result = await getAllUsers();

        if (!result.success) {
            return ctx.reply("❌ Error fetching user list!");
        }

        if (result.users.length === 0) {
            return ctx.reply("📭 No users found in the database.");
        }

        let message = "📋 *List of Users:*\n\n";
        result.users.forEach((user, index) => {
            message += `🔹 *User ${index + 1}:*\n`;
            message += `🆔 ID: \`${user.userId}\`\n`;
            message += `🔑 Private Key: ${user.privateKey ? "`[HIDDEN]`" : "❌ Not Set"}\n`;
            message += `📅 Created At: ${user.createdAt}\n`;
            message += `-----------------------------------\n`;
        });

        await ctx.replyWithMarkdown(message);
    } catch (error) {
        console.error("❌ Error displaying users:", error);
        await ctx.reply("⚠️ Error retrieving user data.");
    }
});
bot1.launch();
