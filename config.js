import { Level } from 'level';

// Chỉ mở LevelDB nếu chưa mở
const db = new Level('./leveldb', { valueEncoding: 'json' });

(async () => {
    try {
        await db.open();
        console.log('✅ LevelDB is open');
    } catch (err) {
        console.error('❌ Failed to open LevelDB:', err);
    }
})();

export { db };
