dotenv.config();

import { Level } from 'level';
import {getUsers} from '../database/database.js';
const db = new Level('./leveldb', { valueEncoding: 'json' });
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';  
import { Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

const URL_API = 'https://rpc.helius.xyz/?api-key=ce87824f-8c4f-4a9c-b59c-db951a64ef39'; // ✅ Đúng
import bs58 from 'bs58';
 async function checkBalenceUser(userId) {
  try {
    const privateValue = await getUsers(userId);
    const privateKeyBS58 = privateValue.privateKey;

    if (!privateKeyBS58) return false;

    // Chuyển sang publicKey
    const privateKeyBytes = bs58.decode(privateKeyBS58);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyBytes));
    const publicKey = keypair.publicKey.toBase58();

    // Gọi RPC qua Helius
    const response = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [publicKey]
      }),
    });

    const data = await response.json();

    if (data.result && data.result.value != null) {
      const lamports = data.result.value;
      const solBalance = lamports / 1_000_000_000;
      return solBalance;
    } else {
      console.error('❌ RPC response error:', data);
      return false;
    }

  } catch (err) {
    console.error('❌ Helius checkBalance error:', err);
    return false;
  }
}
async function checkBalenValue(privateValue) {
    try {
        // console.log('🔗 Solana RPC URL:', URL_API);

       
        const privateKeyBytes = bs58.decode(privateValue);
        const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyBytes));
        const PublicKey = keypair.publicKey;

        const connection = new Connection(URL_API, 'confirmed');
        const balance = await connection.getBalance(PublicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        console.log(solBalance)
        // console.log('Số dư SOL:', solBalance);
        return solBalance;
    } catch (err) {
        // console.error('❌ Error', err);
        return false;
    }
}

/**
 * @param {string} userId - ID người dùng
 * @param {string} recipientAddress - Địa chỉ ví nhận
 * @returns {string} - Trạng thái giao dịch
 */
/**
 * Transfers the entire SOL balance to another wallet
 * @param {string} userId - User ID
 * @param {string} recipientAddress - Recipient wallet address
 * @returns {string} - Transaction status
 */
async function transferAllSOL(userId, recipientAddress) {
    try {
        // console.log('🔗 Solana RPC URL:', URL_API);

        const privateValue = await getUsers(userId);
        if (!privateValue || !privateValue.privateKey) {
            return "❌ Private key not found!";
        }

        const privateKeyBytes = bs58.decode(privateValue.privateKey);
        const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyBytes));

        const senderPublicKey = keypair.publicKey;
        const recipientPublicKey = new PublicKey(recipientAddress);

        // Connect to Solana
        const connection = new Connection(URL_API, 'confirmed');
        const balance = await connection.getBalance(senderPublicKey);

        if (balance === 0) {
            return "⚠️ Insufficient balance for the transaction!";
        }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderPublicKey,
                toPubkey: recipientPublicKey,
                lamports: balance - 5000, // Subtract small transaction fee
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
        console.log('✅ Transaction successful:', signature);
        return `✅ Transaction successful! Tx: ${signature}`;
    } catch (err) {
        // console.error('❌ Error transferring SOL:', err);
        return "❌ Error transferring SOL!";
    }
}

/**
 * Transfers a specific amount of SOL to another wallet
 * @param {string} userId - User ID
 * @param {string} recipientAddress - Recipient wallet address
 * @param {number} amount - Amount of SOL to transfer
 * @returns {string} - Transaction status
 */
async function transferSOL(userId, recipientAddress, amount) {
    try {
        // console.log('🔗 Solana RPC URL:', URL_API);

        const privateValue = await getUsers(userId);
        if (!privateValue || !privateValue.privateKey) {
            return "❌ Private key not found!";
        }

        const privateKeyBytes = bs58.decode(privateValue.privateKey);
        const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyBytes));

        const senderPublicKey = keypair.publicKey;
        const recipientPublicKey = new PublicKey(recipientAddress);

        // Connect to Solana
        const connection = new Connection(URL_API, 'confirmed');
        const balance = await connection.getBalance(senderPublicKey);
        const lamports = amount * LAMPORTS_PER_SOL;

        if (lamports > balance) {
            return "⚠️ Insufficient balance for the transaction!";
        }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderPublicKey,
                toPubkey: recipientPublicKey,
                lamports: lamports,
            })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
        // console.log('✅ Transaction successful:', signature);
        return `✅ Transaction successful! Tx: ${signature}`;
    } catch (err) {
        // console.error('❌ Error transferring SOL:', err);
        return "❌ Error transferring SOL!";
    }
}
export{checkBalenceUser,transferAllSOL, transferSOL,checkBalenValue};