import { Level } from 'level';

// Khởi tạo cơ sở dữ liệu
import { db } from '../config.js';
import moment  from 'moment';
// Hàm tạo tài khoản
async function createAccounts(userId) {
    try {
        const existingUser = await db.get(userId).catch(() => null);
        if (existingUser) {
            return { success: false, message: `⚠️ Wallet already exists!`, userId };
        }

        const createdAt = moment().format("YYYY-MM-DD HH:mm:ss");

        const userData = { id: userId, privateKey: null, createdAt };
        await db.put(userId, userData);

        return { success: true, userId, createdAt };
    } catch (err) {
        console.error("❌ Error creating account:", err);
        return { success: false, message: "❌ Error creating account!" };
    }
}

// Hàm lấy danh sách toàn bộ user
async function getAllUsers() {
    try {
        const users = [];
        
        for await (const [key, value] of db.iterator()) {
            users.push({ userId: key, ...value });
        }

        return { success: true, users };
    } catch (err) {
        console.error("❌ Error fetching users:", err);
        return { success: false, message: "❌ Error fetching users!" };
    }
}

// Hàm cập nhật private key
async function updatePrivateKeys(userId, privateKey) {
    try {
        // Retrieve user data
        const userData = await db.get(userId).catch(() => null);
        if (!userData) return "⚠️ You don't have an account!";

        // Update private key
        userData.privateKey = privateKey;
        await db.put(userId, userData);

        return "✅ Private key has been updated!";
    } catch (err) {
        console.error("Error updating private key:", err);
        return "❌ Error updating private key!";
    }
}

// Hàm lấy thông tin người dùng
async function getUsers(userId) {
    try {

        const userData = await db.get(userId);
        return userData;
    } catch (err) {
        console.error("You don't have an account!", err);
        return null;
    }
}

// Hàm lấy thông tin chi tiết người dùng
async function GetInfoUser(userId) {
    try {
        const existingUser = await db.get(userId).catch(() => null);
        if (existingUser) return existingUser; // Trả về dữ liệu người dùng nếu tồn tại
        return "⚠️ User not found."; // Trả về thông báo nếu không tìm thấy
    } catch (err) {
        console.error("You don't get an account!", err);
        return "❌ You don't get an account!";
    }
}

// Hàm kiểm tra người dùng đã tồn tại chưa
async function checkCreateUser(userId) {
    try {
        const existingUser = await db.get(userId).catch(() => null);
        return !!existingUser; // Trả về true nếu người dùng tồn tại, ngược lại trả về false
    } catch (err) {
        console.error("You don't get an account!", err);
        return false;
    }
}
async function export_keys(userId) {
    try{
        const userData = await db.get(userId).catch(() => null);
        if (!userData) return "⚠️You don't get an account!";

        // Cập nhật private key
        // console.log(userData.privateKey)
        return userData.privateKey ;

    }catch(error){
        console.error("You don't get an account! ")
        return false
    }
}
// Xuất các hàm để sử dụng ở nơi khác
export { checkCreateUser, createAccounts, updatePrivateKeys, getUsers, GetInfoUser,export_keys,getAllUsers};