dotenv.config();

import { Level } from 'level';
import {getUsers} from '../database/database.js';
const db = new Level('./leveldb', { valueEncoding: 'json' });
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';  
import qrcode from 'qrcode';

const URL_API = process.env.URL_API; // ✅ Đúng
import bs58 from 'bs58';

async function send_sols(privateKey) {
    try {
        // Giải mã private key từ Base58
        const privateKeyBytes = bs58.decode(privateKey);
        const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyBytes));

        // Lấy Public Key (địa chỉ ví)
        const publicKey = keypair.publicKey.toBase58();
        
        // Kết nối Solana
        const connection = new Connection(URL_API, 'confirmed');
        const balance = await connection.getBalance(keypair.publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        console.log("Số dư SOL:", solBalance);

        // Tạo mã QR từ địa chỉ ví
        const qrCodeDataURL = await qrcode.toDataURL(publicKey);

        return {
            address: publicKey,
            balance: solBalance,
            qrCode: qrCodeDataURL
        };
    } catch (err) {
        console.error('❌ Error', err);
        return {
            error: "❌Error when checking balance!"

        };
    }
}


export{send_sols};