// IndexedDB initialization for efficient image storage
let db = null;

function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TalentManagerDB', 1);
        
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB initialized successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('media')) {
                const mediaStore = db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
                mediaStore.createIndex('talentId', 'talentId', { unique: false });
            }
        };
    });
}

// Save media to IndexedDB
function saveMediaToIndexedDB(talentId, mediaArray) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('IndexedDB not initialized');
            return;
        }
        
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        
        // Delete existing media for this talent
        const index = store.index('talentId');
        const range = IDBKeyRange.only(talentId);
        const deleteRequest = index.openCursor(range);
        
        deleteRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        
        // Add new media
        mediaArray.forEach(media => {
            store.add({
                talentId: talentId,
                type: media.type,
                src: media.src,
                name: media.name
            });
        });
        
        transaction.oncomplete = () => {
            resolve();
        };
        
        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

// Load media from IndexedDB
function loadMediaFromIndexedDB(talentId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('IndexedDB not initialized');
            return;
        }
        
        const transaction = db.transaction(['media'], 'readonly');
        const store = transaction.objectStore('media');
        const index = store.index('talentId');
        const range = IDBKeyRange.only(talentId);
        const request = index.getAll(range);
        
        request.onsuccess = () => {
            const media = request.result.map(item => ({
                type: item.type,
                src: item.src,
                name: item.name
            }));
            resolve(media);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Delete media from IndexedDB
function deleteMediaFromIndexedDB(talentId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('IndexedDB not initialized');
            return;
        }
        
        const transaction = db.transaction(['media'], 'readwrite');
        const store = transaction.objectStore('media');
        const index = store.index('talentId');
        const range = IDBKeyRange.only(talentId);
        const request = index.openCursor(range);
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        
        transaction.oncomplete = () => {
            resolve();
        };
        
        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}

// Initialize IndexedDB on page load
initIndexedDB().catch(error => {
    console.error('Failed to initialize IndexedDB:', error);
});
