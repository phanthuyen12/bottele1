dotenv.config();

import { Level } from 'level';
import {getUsers} from '../database/database.js';
const db = new Level('./leveldb', { valueEncoding: 'json' });
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';  

const URL_API = process.env.URL_API; // ✅ Đúng
import bs58 from 'bs58';
async function export_keys(userId) {
    
    
}