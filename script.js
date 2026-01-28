// ==================== Firebase Configuration ====================
const firebaseConfig = {
    apiKey: "AIzaSyDVIboC3Dy9OgNhdJV24ZAfglqjq5P-SXM",
    authDomain: "pets-x.firebaseapp.com",
    projectId: "pets-x",
    storageBucket: "pets-x.firebasestorage.app",
    messagingSenderId: "856758180859",
    appId: "1:856758180859:web:0e1b23290572c8970dc95e"
};

// Initialize Firebase
let firebaseApp, db, auth;
try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

// ==================== بيانات التخزين ====================
const STORAGE = {
    PRODUCTS: 'marwan_products',
    CART: 'marwan_cart',
    ORDERS: 'marwan_orders',
    USERS: 'marwan_users',
    COMPLAINTS: 'marwan_complaints',
    OFFERS: 'marwan_offers',
    CUSTOMERS: 'marwan_customers',
    PRODUCT_IMAGES: 'marwan_product_images',
    OFFER_IMAGES: 'marwan_offer_images',
    FIREBASE_SYNC: 'marwan_firebase_sync'
};

// المستخدم الافتراضي
const ADMIN_USER = {
    id: 1,
    email: 'admin@marwanpets.com',
    password: '123456',
    name: 'القصاص',
    role: 'admin',
    phone: '01556650985',
    createdAt: new Date().toISOString()
};

// المنتجات الافتراضية
const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: 'طعام قطط بريميوم',
        price: 150,
        category: 'قطط',
        description: 'أفضل طعام للقطط',
        image: '🐱',
        imageUrl: null,
        stock: 50,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: 'لعبة كلاب',
        price: 85,
        category: 'كلاب',
        description: 'لعبة آمنة للكلاب',
        image: '🐶',
        imageUrl: null,
        stock: 30,
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        name: 'قفص عصافير',
        price: 350,
        category: 'طيور',
        description: 'قفص واسع للطيور',
        image: '🐦',
        imageUrl: null,
        stock: 10,
        createdAt: new Date().toISOString()
    }
];

// العروض الافتراضية
const DEFAULT_OFFERS = [
    {
        id: 1,
        title: 'تخفيضات الصيف',
        description: 'خصم خاص على جميع منتجات القطط',
        discount: 20,
        productId: 1,
        imageUrl: null,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString()
    }
];

// بيانات الصور المؤقتة
let productImageData = {
    productId: null,
    imageUrl: null,
    imageFile: null
};

let offerImageData = {
    offerId: null,
    imageUrl: null,
    imageFile: null
};

// ==================== Firebase Functions ====================

// دالة لحفظ مستخدم في Firebase
async function saveUserToFirebase(userData) {
    try {
        if (!db) {
            console.log("⚠️ Firebase not initialized, using localStorage only");
            return false;
        }
        
        await db.collection('users').add({
            ...userData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            source: 'website',
            firebaseId: null // سيتم ملؤه لاحقاً
        });
        
        console.log("✅ User saved to Firebase:", userData.email);
        return true;
    } catch (error) {
        console.error("❌ Error saving user to Firebase:", error);
        return false;
    }
}

// دالة لحفظ طلب في Firebase
async function saveOrderToFirebase(orderData) {
    try {
        if (!db) {
            console.log("⚠️ Firebase not initialized, using localStorage only");
            return false;
        }
        
        await db.collection('orders').add({
            ...orderData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            firebaseSynced: true
        });
        
        console.log("✅ Order saved to Firebase:", orderData.orderNumber);
        
        // إنشاء إشعار للمشرف
        await createNotification({
            type: 'new_order',
            title: 'طلب جديد',
            message: `طلب جديد من ${orderData.customerName}`,
            data: orderData,
            read: false
        });
        
        return true;
    } catch (error) {
        console.error("❌ Error saving order to Firebase:", error);
        return false;
    }
}

// دالة لإنشاء إشعار في Firebase
async function createNotification(notificationData) {
    try {
        if (!db) {
            console.log("⚠️ Firebase not initialized");
            return false;
        }
        
        await db.collection('notifications').add({
            ...notificationData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        console.log("✅ Notification created:", notificationData.type);
        
        // تحديث عدد الإشعارات غير المقروءة
        updateNotificationsCount();
        
        return true;
    } catch (error) {
        console.error("❌ Error creating notification:", error);
        return false;
    }
}

// دالة لجلب الإشعارات من Firebase
async function loadNotifications() {
    try {
        if (!db || !isAdmin()) return;
        
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">جارٍ تحميل الإشعارات...</div>';
        
        const snapshot = await db.collection('notifications')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-message">لا توجد إشعارات</div>';
            return;
        }
        
        let html = '<div class="notifications-list">';
        
        snapshot.forEach(doc => {
            const notif = doc.data();
            const time = notif.timestamp ? 
                new Date(notif.timestamp.toDate()).toLocaleString('ar-EG') : 
                'قبل قليل';
            
            let icon = '🔔';
            let color = '#2d73ff';
            
            switch(notif.type) {
                case 'new_order':
                    icon = '🛒';
                    color = '#00b894';
                    break;
                case 'new_user':
                    icon = '👤';
                    color = '#9b59b6';
                    break;
                case 'complaint':
                    icon = '📝';
                    color = '#ff9f43';
                    break;
                case 'warning':
                    icon = '⚠️';
                    color = '#ff4757';
                    break;
            }
            
            html += `
                <div class="notification-card ${notif.read ? 'read' : 'unread'}" data-id="${doc.id}">
                    <div class="notification-icon" style="background: ${color}">
                        ${icon}
                    </div>
                    <div class="notification-content">
                        <div class="notification-header">
                            <h4>${notif.title}</h4>
                            <span class="notification-time">${time}</span>
                        </div>
                        <p>${notif.message}</p>
                        
                        ${notif.type === 'new_order' ? `
                            <div class="notification-details">
                                <p><strong>👤 العميل:</strong> ${notif.data?.customerName || 'غير معروف'}</p>
                                <p><strong>📞 الهاتف:</strong> ${notif.data?.phone || 'غير معروف'}</p>
                                <p><strong>💰 الإجمالي:</strong> ${notif.data?.total || 0} ج.م</p>
                                ${notif.data?.address ? `<p><strong>📍 العنوان:</strong> ${notif.data.address}</p>` : ''}
                            </div>
                        ` : ''}
                        
                        ${notif.type === 'new_user' ? `
                            <div class="notification-details">
                                <p><strong>📧 الإيميل:</strong> ${notif.data?.email || 'غير معروف'}</p>
                                <p><strong>📞 الهاتف:</strong> ${notif.data?.phone || 'غير معروف'}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="notification-actions">
                        ${!notif.read ? `
                            <button onclick="markNotificationAsRead('${doc.id}')" class="btn btn-sm btn-success">
                                ✓ قراءة
                            </button>
                        ` : ''}
                        <button onclick="deleteNotification('${doc.id}')" class="btn btn-sm btn-danger">
                            🗑️ حذف
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // تحديث العداد
        updateNotificationsCount();
        
    } catch (error) {
        console.error("❌ Error loading notifications:", error);
        document.getElementById('notificationsContainer').innerHTML = 
            '<div class="error-message">خطأ في تحميل الإشعارات</div>';
    }
}

// تحديث عدد الإشعارات غير المقروءة
async function updateNotificationsCount() {
    try {
        if (!db || !isAdmin()) return;
        
        const snapshot = await db.collection('notifications')
            .where('read', '==', false)
            .get();
        
        const count = snapshot.size;
        const countElement = document.getElementById('notificationsCount');
        const adminCountElement = document.getElementById('adminNotificationsCount');
        const adminBadge = document.getElementById('adminNotificationsCountBadge');
        
        if (countElement) {
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'inline-block' : 'none';
        }
        
        if (adminCountElement) {
            adminCountElement.textContent = count;
        }
        
        if (adminBadge) {
            adminBadge.textContent = count;
            adminBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
        
    } catch (error) {
        console.error("❌ Error updating notifications count:", error);
    }
}

// تحديد إشعار كمقروء
async function markNotificationAsRead(notificationId) {
    try {
        if (!db) return;
        
        await db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // تحديث العرض
        loadNotifications();
        showMessage('تم تحديد الإشعار كمقروء', 'success');
        
    } catch (error) {
        console.error("❌ Error marking notification as read:", error);
        showMessage('حدث خطأ', 'error');
    }
}

// تحديد كل الإشعارات كمقروءة
async function markAllNotificationsAsRead() {
    try {
        if (!db || !isAdmin()) return;
        
        if (!confirm('هل تريد تحديد كل الإشعارات كمقروءة؟')) return;
        
        const snapshot = await db.collection('notifications')
            .where('read', '==', false)
            .get();
        
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.update(doc.ref, {
                read: true,
                readAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        showMessage('تم تحديد كل الإشعارات كمقروءة', 'success');
        loadNotifications();
        
    } catch (error) {
        console.error("❌ Error marking all notifications as read:", error);
        showMessage('حدث خطأ', 'error');
    }
}

// حذف إشعار
async function deleteNotification(notificationId) {
    try {
        if (!db) return;
        
        if (!confirm('هل تريد حذف هذا الإشعار؟')) return;
        
        await db.collection('notifications').doc(notificationId).delete();
        
        // تحديث العرض
        loadNotifications();
        showMessage('تم حذف الإشعار', 'success');
        
    } catch (error) {
        console.error("❌ Error deleting notification:", error);
        showMessage('حدث خطأ', 'error');
    }
}

// حذف كل الإشعارات
async function clearAllNotifications() {
    try {
        if (!db || !isAdmin()) return;
        
        if (!confirm('هل تريد حذف كل الإشعارات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        
        const snapshot = await db.collection('notifications').get();
        
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        showMessage('تم حذف كل الإشعارات', 'success');
        loadNotifications();
        
    } catch (error) {
        console.error("❌ Error clearing all notifications:", error);
        showMessage('حدث خطأ', 'error');
    }
}

// فلترة الإشعارات
function filterNotifications(filterType) {
    const cards = document.querySelectorAll('.notification-card');
    const filterButtons = document.querySelectorAll('.notification-filters .btn');
    
    // تحديث حالة الأزرار
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(getFilterText(filterType))) {
            btn.classList.add('active');
        }
    });
    
    cards.forEach(card => {
        const type = card.querySelector('.notification-icon').textContent;
        const isRead = card.classList.contains('read');
        
        let show = true;
        
        switch(filterType) {
            case 'all':
                show = true;
                break;
            case 'unread':
                show = !isRead;
                break;
            case 'new_order':
                show = type === '🛒';
                break;
            case 'new_user':
                show = type === '👤';
                break;
            case 'complaint':
                show = type === '📝';
                break;
        }
        
        card.style.display = show ? 'flex' : 'none';
    });
}

function getFilterText(filterType) {
    const filters = {
        'all': 'الكل',
        'unread': 'غير مقروء',
        'new_order': 'طلبات',
        'new_user': 'عملاء',
        'complaint': 'شكاوى'
    };
    return filters[filterType] || filterType;
}

// دالة لجلب العملاء من Firebase
async function loadCustomersFromFirebase() {
    try {
        if (!db || !isAdmin()) return [];
        
        const snapshot = await db.collection('users')
            .where('role', '!=', 'admin')
            .orderBy('createdAt', 'desc')
            .get();
        
        const customers = [];
        snapshot.forEach(doc => {
            customers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return customers;
    } catch (error) {
        console.error("❌ Error loading customers from Firebase:", error);
        return [];
    }
}

// دالة لجلب الطلبات من Firebase
async function loadOrdersFromFirebase() {
    try {
        if (!db || !isAdmin()) return [];
        
        const snapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return orders;
    } catch (error) {
        console.error("❌ Error loading orders from Firebase:", error);
        return [];
    }
}

// تحديث إحصائيات Firebase
async function updateFirebaseStats() {
    try {
        if (!db || !isAdmin()) return;
        
        // جلب عدد الطلبات
        const ordersSnapshot = await db.collection('orders').get();
        document.getElementById('firebaseOrders').textContent = ordersSnapshot.size;
        
        // جلب عدد المستخدمين
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('firebaseUsers').textContent = usersSnapshot.size;
        
        // جلب عدد الإشعارات
        const notificationsSnapshot = await db.collection('notifications').get();
        document.getElementById('firebaseNotifications').textContent = notificationsSnapshot.size;
        
        // تحديث وقت آخر مزامنة
        const now = new Date();
        document.getElementById('firebaseSyncTime').textContent = 'جاري...';
        setTimeout(() => {
            document.getElementById('firebaseSyncTime').textContent = 'فوري';
        }, 500);
        
        // تحديث وقت آخر تحديث
        document.getElementById('lastUpdateTime').textContent = 
            `آخر تحديث: ${now.toLocaleTimeString('ar-EG')}`;
            
    } catch (error) {
        console.error("❌ Error updating Firebase stats:", error);
    }
}

// مزامنة بيانات Firebase مع localStorage
async function syncFirebaseData() {
    try {
        if (!db || !isAdmin()) {
            showMessage('يجب أن تكون مشرفاً لمزامنة البيانات', 'warning');
            return;
        }
        
        showMessage('جارٍ مزامنة البيانات مع Firebase...', 'info');
        
        // مزامنة المستخدمين
        const localUsers = getUsers();
        for (const user of localUsers) {
            if (!user.firebaseSynced) {
                await saveUserToFirebase(user);
                user.firebaseSynced = true;
            }
        }
        
        // مزامنة الطلبات
        const localOrders = getOrders();
        for (const order of localOrders) {
            if (!order.firebaseSynced) {
                await saveOrderToFirebase(order);
                order.firebaseSynced = true;
            }
        }
        
        // تحديث الإحصائيات
        updateFirebaseStats();
        updateHomeStats();
        
        showMessage('تمت مزامنة البيانات مع Firebase بنجاح', 'success');
        
    } catch (error) {
        console.error("❌ Error syncing Firebase data:", error);
        showMessage('حدث خطأ أثناء المزامنة', 'error');
    }
}

// ==================== التهيئة ====================
function initApp() {
    initStorage();
    setupEvents();
    updateUI();
    loadProducts();
    loadOffers();
    updateCartCount();
    startOffersCountdown();
    startRealtimeUpdates();
    
    // بدء تحديث الإشعارات للمشرف
    if (isAdmin()) {
        setInterval(updateNotificationsCount, 30000); // تحديث كل 30 ثانية
        setInterval(updateFirebaseStats, 60000); // تحديث الإحصائيات كل دقيقة
        updateNotificationsCount();
        updateFirebaseStats();
    }
}

function initStorage() {
    if (!localStorage.getItem(STORAGE.PRODUCTS)) {
        localStorage.setItem(STORAGE.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE.USERS)) {
        localStorage.setItem(STORAGE.USERS, JSON.stringify([ADMIN_USER]));
    }
    if (!localStorage.getItem(STORAGE.CART)) {
        localStorage.setItem(STORAGE.CART, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE.ORDERS)) {
        localStorage.setItem(STORAGE.ORDERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE.COMPLAINTS)) {
        localStorage.setItem(STORAGE.COMPLAINTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE.OFFERS)) {
        localStorage.setItem(STORAGE.OFFERS, JSON.stringify(DEFAULT_OFFERS));
    }
    if (!localStorage.getItem(STORAGE.CUSTOMERS)) {
        localStorage.setItem(STORAGE.CUSTOMERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE.PRODUCT_IMAGES)) {
        localStorage.setItem(STORAGE.PRODUCT_IMAGES, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE.OFFER_IMAGES)) {
        localStorage.setItem(STORAGE.OFFER_IMAGES, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE.FIREBASE_SYNC)) {
        localStorage.setItem(STORAGE.FIREBASE_SYNC, JSON.stringify({
            lastSync: null,
            syncedOrders: [],
            syncedUsers: []
        }));
    }
}

// ==================== تحديث مباشر من Firebase ====================
function startRealtimeUpdates() {
    if (!db || !isAdmin()) return;
    
    // الاستماع للطلبات الجديدة
    db.collection('orders')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            if (!snapshot.empty) {
                const newOrdersCount = snapshot.docs.filter(doc => {
                    const data = doc.data();
                    const orderTime = data.timestamp ? data.timestamp.toDate() : new Date();
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    return orderTime > fiveMinutesAgo;
                }).length;
                
                if (newOrdersCount > 0) {
                    document.getElementById('adminNewOrdersCount').textContent = `+${newOrdersCount} جديد`;
                    document.getElementById('adminNewOrdersCount').style.animation = 'pulse 1.5s infinite';
                    
                    // تحديث قائمة الطلبات
                    loadAdminOrdersFromFirebase();
                }
            }
        });
    
    // الاستماع للمستخدمين الجدد
    db.collection('users')
        .where('role', '!=', 'admin')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            if (!snapshot.empty) {
                const newUsersCount = snapshot.docs.filter(doc => {
                    const data = doc.data();
                    const userTime = data.createdAt ? data.createdAt.toDate() : new Date();
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    return userTime > fiveMinutesAgo;
                }).length;
                
                if (newUsersCount > 0) {
                    document.getElementById('adminNewCustomersCount').textContent = `+${newUsersCount} جديد`;
                    document.getElementById('adminNewCustomersCount').style.animation = 'pulse 1.5s infinite';
                }
            }
        });
}

// تحميل الطلبات من Firebase للوحة التحكم
async function loadAdminOrdersFromFirebase() {
    try {
        if (!db || !isAdmin()) return;
        
        const container = document.getElementById('adminOrdersList');
        if (!container) return;
        
        const snapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-message">لا توجد طلبات</div>';
            return;
        }
        
        let html = '<div class="orders-list">';
        
        snapshot.forEach(doc => {
            const order = doc.data();
            const time = order.timestamp ? 
                new Date(order.timestamp.toDate()).toLocaleString('ar-EG') : 
                'قبل قليل';
            
            html += `
                <div class="order-card">
                    <div class="order-header">
                        <h4>الطلب #${order.orderNumber || doc.id.substring(0, 8)}</h4>
                        <span class="status-badge">${order.status || 'جديد'}</span>
                        <span class="source-badge" style="background: #9b59b6;">Firebase</span>
                    </div>
                    <div class="order-details">
                        <p><strong>العميل:</strong> ${order.customerName || 'غير معروف'}</p>
                        <p><strong>الهاتف:</strong> ${order.phone || 'غير معروف'}</p>
                        <p><strong>الإجمالي:</strong> ${order.total || 0} ج.م</p>
                        <p><strong>التاريخ:</strong> ${time}</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("❌ Error loading orders from Firebase:", error);
    }
}

// ==================== إدارة البيانات ====================
function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE.PRODUCTS) || '[]');
}

function getCart() {
    return JSON.parse(localStorage.getItem(STORAGE.CART) || '[]');
}

function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE.ORDERS) || '[]');
}

function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE.USERS) || '[]');
}

function getComplaints() {
    return JSON.parse(localStorage.getItem(STORAGE.COMPLAINTS) || '[]');
}

function getOffers() {
    return JSON.parse(localStorage.getItem(STORAGE.OFFERS) || '[]');
}

function getCustomers() {
    const users = getUsers();
    return users.filter(user => user.role !== 'admin');
}

function getProductImages() {
    return JSON.parse(localStorage.getItem(STORAGE.PRODUCT_IMAGES) || '{}');
}

function getOfferImages() {
    return JSON.parse(localStorage.getItem(STORAGE.OFFER_IMAGES) || '{}');
}

function saveProducts(products) {
    localStorage.setItem(STORAGE.PRODUCTS, JSON.stringify(products));
}

function saveCart(cart) {
    localStorage.setItem(STORAGE.CART, JSON.stringify(cart));
    updateCartCount();
}

function saveOrders(orders) {
    localStorage.setItem(STORAGE.ORDERS, JSON.stringify(orders));
}

function saveComplaints(complaints) {
    localStorage.setItem(STORAGE.COMPLAINTS, JSON.stringify(complaints));
}

function saveOffers(offers) {
    localStorage.setItem(STORAGE.OFFERS, JSON.stringify(offers));
}

function saveProductImages(images) {
    localStorage.setItem(STORAGE.PRODUCT_IMAGES, JSON.stringify(images));
}

function saveOfferImages(images) {
    localStorage.setItem(STORAGE.OFFER_IMAGES, JSON.stringify(images));
}

// ==================== تعديل دوال التسجيل والطلبات ====================

// تعديل دالة register لحفظ في Firebase
async function register() {
    const name = document.getElementById('registerName')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const phone = document.getElementById('registerPhone')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirm = document.getElementById('registerConfirm')?.value;
    
    // التحقق من البيانات
    if (!name || !email || !phone || !password) {
        showMessage('جميع الحقول مطلوبة', 'error');
        return;
    }
    
    if (password !== confirm) {
        showMessage('كلمة المرور غير متطابقة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('البريد الإلكتروني غير صحيح', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showMessage('رقم الهاتف غير صحيح', 'error');
        return;
    }
    
    const users = getUsers();
    if (users.some(user => user.email === email)) {
        showMessage('البريد الإلكتروني موجود بالفعل', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password,
        role: 'user',
        createdAt: new Date().toISOString(),
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: null,
        firebaseSynced: false
    };
    
    // حفظ في localStorage
    users.push(newUser);
    localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // حفظ في Firebase
    await saveUserToFirebase(newUser);
    
    // إنشاء إشعار للمشرف
    await createNotification({
        type: 'new_user',
        title: 'عميل جديد',
        message: `تم تسجيل عميل جديد: ${name}`,
        data: { name, email, phone },
        read: false
    });
    
    showMessage(`مرحباً ${name}! تم إنشاء حسابك بنجاح`, 'success');
    updateUI();
    showSection('home');
    resetRegisterForm();
}

// تعديل دالة checkout لحفظ في Firebase
async function checkout() {
    const cart = getCart();
    
    if (cart.length === 0) {
        showMessage('السلة فارغة', 'error');
        return;
    }
    
    const user = getCurrentUser();
    let customerName, phone, address;
    
    if (user) {
        customerName = user.name;
        phone = user.phone;
        address = prompt('الرجاء إدخال عنوان التوصيل:') || '';
    } else {
        customerName = prompt('اسمك:');
        phone = prompt('رقم الهاتف:');
        address = prompt('العنوان:');
        
        if (!customerName || !phone || !address) {
            showMessage('البيانات غير مكتملة', 'error');
            return;
        }
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderNumber = 'ORD-' + Date.now();
    
    const orderData = {
        orderNumber: orderNumber,
        customerName,
        phone,
        address,
        items: cart.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            hasOffer: item.hasOffer || false
        })),
        total,
        status: 'جديد',
        date: new Date().toLocaleString('ar-EG'),
        userId: user?.id || null,
        userEmail: user?.email || null,
        firebaseSynced: false
    };
    
    // حفظ في localStorage
    const orders = getOrders();
    orders.push(orderData);
    saveOrders(orders);
    
    // تحديث إحصائيات المستخدم
    if (user) {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex].totalOrders = (users[userIndex].totalOrders || 0) + 1;
            users[userIndex].totalSpent = (users[userIndex].totalSpent || 0) + total;
            users[userIndex].lastOrderDate = new Date().toISOString();
            localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
        }
    }
    
    // حفظ في Firebase
    await saveOrderToFirebase(orderData);
    
    // إرسال واتساب
    sendWhatsAppOrder(orderData);
    
    // تفريغ السلة
    saveCart([]);
    
    showMessage('تم تأكيد الطلب! سنتصل بك قريباً', 'success');
    showSection('home');
    updateHomeStats();
}

// ==================== تعديل دوال المشرف ====================

// تعديل دالة loadAdminPanel
async function loadAdminPanel() {
    loadAdminProducts();
    loadAdminOffers();
    await loadAdminOrders();
    await loadAdminOrdersFromFirebase();
    updateHomeStats();
    await updateNotificationsCount();
    await updateFirebaseStats();
}

// تعديل دالة loadCustomers
async function loadCustomers() {
    const container = document.getElementById('customersContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">جارٍ تحميل العملاء...</div>';
    
    try {
        // جلب العملاء من Firebase
        const firebaseCustomers = await loadCustomersFromFirebase();
        
        // جلب العملاء من localStorage
        const localCustomers = getCustomers();
        
        // دمج العملاء
        const allCustomers = [...firebaseCustomers, ...localCustomers];
        
        if (allCustomers.length === 0) {
            container.innerHTML = '<div class="empty-message">لا يوجد عملاء مسجلين</div>';
            return;
        }
        
        // عرض العملاء
        let html = '<div class="customers-grid">';
        allCustomers.forEach((customer, index) => {
            const source = customer.timestamp ? 'Firebase' : 'Local';
            const createdAt = customer.createdAt ? 
                (typeof customer.createdAt === 'string' ? 
                    new Date(customer.createdAt).toLocaleDateString('ar-EG') : 
                    customer.createdAt.toDate ? 
                        new Date(customer.createdAt.toDate()).toLocaleDateString('ar-EG') : 
                        'غير معروف') : 
                'غير معروف';
            
            const orders = customer.totalOrders || 0;
            const spent = customer.totalSpent || 0;
            
            html += `
                <div class="customer-card" onclick="showCustomerDetails(${index}, '${source}')">
                    <div class="customer-header">
                        <div class="customer-avatar" style="background: ${getAvatarColor(index)};">
                            ${customer.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h4>${customer.name || 'غير معروف'}</h4>
                            <p class="customer-email">${customer.email || 'غير معروف'}</p>
                        </div>
                    </div>
                    <div class="customer-details">
                        <div class="detail-item">
                            <span class="detail-label">📞 الهاتف</span>
                            <span class="detail-value">${customer.phone || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📅 التسجيل</span>
                            <span class="detail-value">${createdAt}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📊 المصدر</span>
                            <span class="detail-value">${source}</span>
                        </div>
                    </div>
                    <div class="customer-stats">
                        <div class="stat-item">
                            <div class="stat-number">${orders}</div>
                            <div class="stat-label">الطلبات</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${spent} ج.م</div>
                            <div class="stat-label">إجمالي المشتريات</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("❌ Error loading customers:", error);
        container.innerHTML = '<div class="error-message">خطأ في تحميل العملاء</div>';
    }
}

// ==================== دوال مساعدة ====================
function showSection(sectionId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const section = document.getElementById(sectionId);
    const link = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    
    if (section) section.classList.add('active');
    if (link) link.classList.add('active');
    
    switch(sectionId) {
        case 'home': 
            updateHomeStats();
            break;
        case 'products': 
            loadProducts(); 
            break;
        case 'offers':
            loadOffers();
            break;
        case 'cart': 
            loadCart(); 
            break;
        case 'complaints': 
            if (checkLogin(true)) {
                loadComplaints();
            }
            break;
        case 'notifications':
            if (checkLogin(true) && isAdmin()) {
                loadNotifications();
            }
            break;
        case 'admin': 
            if (isAdmin()) {
                loadAdminPanel();
                document.getElementById('customersSection').style.display = 'none';
                document.getElementById('adminDefaultSections').style.display = 'block';
            } else {
                showSection('login');
            }
            break;
    }
}

function updateUI() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const adminLink = document.getElementById('adminLink');
    const complaintsLink = document.getElementById('complaintsLink');
    const addOfferBtn = document.getElementById('addOfferBtn');
    const newComplaintBtn = document.getElementById('newComplaintBtn');
    const notificationsLink = document.getElementById('notificationsLink');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'inline-block';
            userInfo.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: linear-gradient(135deg, #2d73ff, #9b59b6); color: white; padding: 5px 15px; border-radius: 20px;">
                        👤 ${user.name}
                    </span>
                    <button onclick="logout()" class="btn btn-danger btn-sm">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        }
        if (adminLink) {
            adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
        }
        if (complaintsLink) {
            complaintsLink.style.display = 'block';
        }
        if (addOfferBtn) {
            addOfferBtn.style.display = user.role === 'admin' ? 'block' : 'none';
        }
        if (newComplaintBtn) {
            newComplaintBtn.style.display = 'block';
        }
        if (notificationsLink) {
            notificationsLink.style.display = user.role === 'admin' ? 'block' : 'none';
            updateNotificationsCount();
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (complaintsLink) complaintsLink.style.display = 'none';
        if (addOfferBtn) addOfferBtn.style.display = 'none';
        if (newComplaintBtn) newComplaintBtn.style.display = 'none';
        if (notificationsLink) notificationsLink.style.display = 'none';
    }
}

// ==================== دوال تصدير البيانات ====================
function exportCustomers() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const customers = getCustomers();
    const csvContent = "data:text/csv;charset=utf-8," 
        + "الاسم,البريد الإلكتروني,رقم الهاتف,عدد الطلبات,إجمالي المشتريات,تاريخ التسجيل\n"
        + customers.map(customer => 
            `"${customer.name}","${customer.email}","${customer.phone}",${customer.totalOrders || 0},${customer.totalSpent || 0},"${formatDate(customer.createdAt)}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "عملاء_المتجر.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('تم تصدير بيانات العملاء', 'success');
}

// ==================== باقي الدوال الأصلية (تظل كما هي) ====================
// [كل الدوال الأصلية التي لم تتغير تبقى هنا كما هي...]

// المنتجات
function loadProducts() { /* ... */ }
function addToCart(productId) { /* ... */ }
function showAddProductModal() { /* ... */ }
function saveNewProduct() { /* ... */ }

// السلة
function loadCart() { /* ... */ }
function updateCartItem(itemId, newQuantity) { /* ... */ }

// المستخدمين
function login() { /* ... */ }
function logout() { /* ... */ }
function getCurrentUser() { /* ... */ }
function isAdmin() { /* ... */ }
function checkLogin(showAlert = false) { /* ... */ }

// إنشاء حساب
function register() { /* ... */ } // معدلة
function isValidEmail(email) { /* ... */ }
function isValidPhone(phone) { /* ... */ }
function resetRegisterForm() { /* ... */ }

// الطلبات
function checkout() { /* ... */ } // معدلة
function sendWhatsAppOrder(order) { /* ... */ }

// العروض
function loadOffers() { /* ... */ }
function openAddOfferModal() { /* ... */ }
function saveOffer() { /* ... */ }
function deleteOffer(offerId) { /* ... */ }
function startOffersCountdown() { /* ... */ }
function updateOffersCountdown(offers = null) { /* ... */ }

// الشكاوى
function loadComplaints() { /* ... */ }
function openNewComplaintModal() { /* ... */ }
function submitComplaint() { /* ... */ }
function openAdminReplyModal(complaintId) { /* ... */ }
function saveAdminReply() { /* ... */ }
function updateComplaintStatus(complaintId, status) { /* ... */ }
function deleteComplaint(complaintId) { /* ... */ }

// العملاء
function showCustomersSection() { /* ... */ } // معدلة
function filterCustomers() { /* ... */ }
function showCustomerDetails(customerId, source = 'local') { /* ... */ } // معدلة
function getAvatarColor(id) { /* ... */ }

// لوحة التحكم
function loadAdminProducts() { /* ... */ }
function loadAdminOffers() { /* ... */ }
function loadAdminOrders() { /* ... */ } // معدلة

// الرسائل
function showMessage(text, type = 'success') { /* ... */ }
function closeModal(modalId) { /* ... */ }
function formatDate(dateString) { /* ... */ }

// فلترة المنتجات
function filterByCategory(category) { /* ... */ }

// إعداد الأحداث
function setupEvents() { /* ... */ }

// إصلاح الروابط على الموبايل
document.addEventListener('DOMContentLoaded', function() {
    // إصلاح جميع روابط القفز
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // إظهار القسم
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                targetElement.classList.add('active');
                
                // تحديث القائمة
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
                
                // تمرير سلس للموبايل
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// بدء التطبيق
document.addEventListener('DOMContentLoaded', initApp);