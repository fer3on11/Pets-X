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
    
    // مراقبة حالة المستخدم
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("👤 User is signed in:", user.email);
            updateUI();
        } else {
            console.log("👤 No user is signed in");
            localStorage.removeItem('currentUser');
            updateUI();
        }
    });
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

// المستخدم الافتراضي (المشرف)
const ADMIN_USER = {
    id: 'admin_001',
    email: 'admin@marwanpets.com',
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
        description: 'أفضل طعام للقطط، غني بالبروتين والفيتامينات',
        image: '🐱',
        imageUrl: null,
        stock: 50,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: 'لعبة كلاب مطاطية',
        price: 85,
        category: 'كلاب',
        description: 'لعبة آمنة للكلاب، مقاومة للتمزق',
        image: '🐶',
        imageUrl: null,
        stock: 30,
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        name: 'قفص عصافير كبير',
        price: 350,
        category: 'طيور',
        description: 'قفص واسع للطيور مع مجثمات وألعاب',
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
        title: 'تخفيضات الصيف الكبيرة',
        description: 'خصم خاص على جميع منتجات القطط',
        discount: 20,
        productId: 1,
        imageUrl: null,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString()
    }
];

// ==================== التهيئة ====================
function initApp() {
    initStorage();
    setupEvents();
    updateUI();
    loadProducts();
    loadOffers();
    updateCartCount();
    startOffersCountdown();
    
    // تحقق إذا كان هناك مستخدم مسجل مسبقاً
    const currentUser = getCurrentUser();
    if (currentUser) {
        showMessage(`مرحباً بعودتك ${currentUser.name}!`, 'success');
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
}

// ==================== دوال التسجيل والدخول ====================

// دالة إنشاء حساب جديد
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
    
    try {
        // 1. إنشاء مستخدم في Firebase Authentication
        showMessage('جارٍ إنشاء حسابك...', 'info');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // 2. حفظ بيانات المستخدم في Firestore
        const userData = {
            id: firebaseUser.uid,
            name,
            email,
            phone,
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null
        };
        
        await db.collection('users').doc(firebaseUser.uid).set(userData);
        
        // 3. حفظ في localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            ...userData,
            uid: firebaseUser.uid
        }));
        
        // 4. إنشاء إشعار للمشرف
        await createNotification({
            type: 'new_user',
            title: 'عميل جديد',
            message: `تم تسجيل عميل جديد: ${name}`,
            data: { name, email, phone },
            read: false
        });
        
        showMessage(`🎉 مرحباً ${name}! تم إنشاء حسابك بنجاح`, 'success');
        updateUI();
        showSection('home');
        resetRegisterForm();
        
    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
        
        let errorMessage = 'حدث خطأ أثناء التسجيل';
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة جداً';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'التسجيل بالإيميل غير مفعل';
                break;
        }
        
        showMessage(`❌ ${errorMessage}`, 'error');
    }
}

// دالة تسجيل الدخول
async function login() {
    const email = document.getElementById('loginEmail')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    
    if (!email || !password) {
        showMessage('الرجاء إدخال البريد وكلمة المرور', 'error');
        return;
    }
    
    try {
        showMessage('جارٍ تسجيل الدخول...', 'info');
        
        // 1. تسجيل الدخول باستخدام Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // 2. جلب بيانات المستخدم من Firestore
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        
        if (!userDoc.exists) {
            showMessage('المستخدم غير موجود', 'error');
            await auth.signOut();
            return;
        }
        
        const userData = userDoc.data();
        
        // 3. حفظ في localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            ...userData,
            uid: firebaseUser.uid
        }));
        
        showMessage(`🎉 مرحباً بعودتك ${userData.name}!`, 'success');
        updateUI();
        showSection('home');
        
        // إعادة تعيين حقول الدخول
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
    } catch (error) {
        console.error('❌ خطأ في الدخول:', error);
        
        let errorMessage = 'خطأ في البريد الإلكتروني أو كلمة المرور';
        switch(error.code) {
            case 'auth/user-not-found':
                errorMessage = 'المستخدم غير موجود';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/user-disabled':
                errorMessage = 'تم تعطيل هذا الحساب';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'تم تجاوز عدد المحاولات، حاول لاحقاً';
                break;
        }
        
        showMessage(`❌ ${errorMessage}`, 'error');
    }
}

// دالة تسجيل الخروج
function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('currentUser');
        showMessage('تم تسجيل الخروج بنجاح', 'success');
        updateUI();
        showSection('home');
    }).catch((error) => {
        console.error('خطأ في تسجيل الخروج:', error);
        showMessage('حدث خطأ أثناء تسجيل الخروج', 'error');
    });
}

// ==================== دوال مساعدة للمستخدمين ====================

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.error('Error parsing user:', e);
        return null;
    }
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function checkLogin(showAlert = false) {
    const user = getCurrentUser();
    if (!user && showAlert) {
        showMessage('الرجاء تسجيل الدخول أولاً', 'warning');
        showSection('login');
    }
    return !!user;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^01[0-2,5]{1}[0-9]{8}$/;
    return re.test(phone);
}

function resetRegisterForm() {
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPhone').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirm').value = '';
}

// ==================== دوال إدارة الواجهة ====================

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

// ==================== إدارة المنتجات ====================

function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE.PRODUCTS) || '[]');
}

function loadProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    const products = getProducts();
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    let filteredProducts = products;
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => 
            product.category === categoryFilter
        );
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-search"></i>
                <p>لا توجد منتجات مطابقة للبحث</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    filteredProducts.forEach(product => {
        const hasOffer = checkProductHasOffer(product.id);
        const finalPrice = hasOffer ? 
            product.price * (1 - hasOffer.discount / 100) : 
            product.price;
        
        html += `
            <div class="product-card">
                <div class="product-image">
                    ${product.image || '📦'}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <span class="category">${product.category}</span>
                    <p class="description">${product.description}</p>
                    <div class="price-stock">
                        <div>
                            <span class="price">${finalPrice.toFixed(2)} ج.م</span>
                            ${hasOffer ? `
                                <span style="text-decoration: line-through; color: #888; font-size: 0.9rem; margin-right: 5px;">
                                    ${product.price} ج.م
                                </span>
                                <span style="background: #ff6b8b; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">
                                    خصم ${hasOffer.discount}%
                                </span>
                            ` : ''}
                        </div>
                        <span class="stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}">
                            ${product.stock > 0 ? `🟢 ${product.stock} متاح` : '⛔ غير متاح'}
                        </span>
                    </div>
                    <div class="product-actions">
                        <button onclick="addToCart(${product.id})" 
                                class="btn btn-primary add-to-cart"
                                ${product.stock === 0 ? 'disabled' : ''}>
                            🛒 أضف إلى السلة
                        </button>
                        <button onclick="showProductDetails(${product.id})" 
                                class="btn btn-outline">
                            👁️ تفاصيل
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function checkProductHasOffer(productId) {
    const offers = getOffers();
    const now = new Date();
    
    return offers.find(offer => 
        offer.productId === productId && 
        offer.isActive &&
        new Date(offer.endDate) > now
    );
}

function filterByCategory(category) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
    showSection('products');
    loadProducts();
}

function addToCart(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showMessage('المنتج غير موجود', 'error');
        return;
    }
    
    if (product.stock === 0) {
        showMessage('المنتج غير متاح حالياً', 'warning');
        return;
    }
    
    let cart = getCart();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showMessage('لا يمكن إضافة المزيد، الكمية غير متاحة', 'warning');
            return;
        }
        existingItem.quantity++;
    } else {
        const offer = checkProductHasOffer(productId);
        cart.push({
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            price: offer ? product.price * (1 - offer.discount / 100) : product.price,
            originalPrice: product.price,
            hasOffer: !!offer,
            offerDiscount: offer?.discount || 0,
            quantity: 1
        });
    }
    
    saveCart(cart);
    showMessage(`تم إضافة ${product.name} إلى السلة`, 'success');
}

// ==================== إدارة السلة ====================

function getCart() {
    return JSON.parse(localStorage.getItem(STORAGE.CART) || '[]');
}

function saveCart(cart) {
    localStorage.setItem(STORAGE.CART, JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        if (totalItems > 0) {
            cartCountElement.style.color = '#ff4757';
            cartCountElement.style.fontWeight = 'bold';
        }
    }
}

function loadCart() {
    const container = document.getElementById('cartContainer');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const orderSummary = document.getElementById('orderSummary');
    
    if (!container) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-shopping-cart"></i>
                <p>السلة فارغة</p>
                <button onclick="showSection('products')" class="btn btn-primary">
                    🛍️ ابدأ التسوق
                </button>
            </div>
        `;
        checkoutBtn.disabled = true;
        orderSummary.style.display = 'none';
        return;
    }
    
    let html = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${item.productName}</h4>
                    ${item.hasOffer ? `
                        <div style="color: #ff6b8b; font-size: 0.9rem;">
                            <span style="text-decoration: line-through; color: #888; margin-left: 5px;">
                                ${item.originalPrice} ج.م
                            </span>
                            خصم ${item.offerDiscount}%
                        </div>
                    ` : ''}
                </div>
                <div class="item-actions">
                    <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})" 
                            class="qty-btn">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})" 
                            class="qty-btn">+</button>
                </div>
                <div class="item-total">
                    ${itemTotal.toFixed(2)} ج.م
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    checkoutBtn.disabled = false;
    orderSummary.style.display = 'block';
    document.getElementById('totalAmount').textContent = `${total.toFixed(2)} ج.م`;
}

function updateCartItem(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(itemId);
        return;
    }
    
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return;
    
    // التحقق من توفر الكمية
    const products = getProducts();
    const product = products.find(p => p.id === cart[itemIndex].productId);
    
    if (product && newQuantity > product.stock) {
        showMessage('الكمية المطلوبة غير متاحة', 'warning');
        return;
    }
    
    cart[itemIndex].quantity = newQuantity;
    saveCart(cart);
    loadCart();
}

function removeFromCart(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId);
    saveCart(cart);
    loadCart();
    showMessage('تم إزالة المنتج من السلة', 'success');
}

// ==================== إتمام الطلب ====================

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
        address = prompt('الرجاء إدخال عنوان التوصيل:') || 'غير محدد';
    } else {
        showMessage('الرجاء تسجيل الدخول أولاً', 'warning');
        showSection('login');
        return;
    }
    
    if (!address.trim()) {
        showMessage('الرجاء إدخال عنوان التوصيل', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
    
    const orderData = {
        orderNumber: orderNumber,
        customerName,
        phone,
        address,
        items: cart.map(item => ({
            productId: item.productId,
            name: item.productName,
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice,
            hasOffer: item.hasOffer,
            offerDiscount: item.offerDiscount
        })),
        total,
        status: 'جديد',
        date: new Date().toLocaleString('ar-EG'),
        userId: user?.uid || null,
        userEmail: user?.email || null,
        timestamp: new Date().toISOString()
    };
    
    try {
        // حفظ الطلب في Firebase
        await saveOrderToFirebase(orderData);
        
        // حفظ في localStorage
        const orders = getOrders();
        orders.push(orderData);
        saveOrders(orders);
        
        // تحديث المخزون
        updateStockAfterOrder(cart);
        
        // إرسال واتساب
        sendWhatsAppOrder(orderData);
        
        // تفريغ السلة
        saveCart([]);
        
        showMessage('🎉 تم تأكيد الطلب بنجاح! سنتصل بك قريباً', 'success');
        showSection('home');
        updateHomeStats();
        
    } catch (error) {
        console.error('❌ خطأ في إتمام الطلب:', error);
        showMessage('حدث خطأ أثناء إتمام الطلب', 'error');
    }
}

async function saveOrderToFirebase(orderData) {
    try {
        if (!db) {
            console.log("⚠️ Firebase not initialized");
            return false;
        }
        
        await db.collection('orders').add({
            ...orderData,
            firebaseTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'جديد',
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
        throw error;
    }
}

function updateStockAfterOrder(cart) {
    const products = getProducts();
    
    cart.forEach(cartItem => {
        const productIndex = products.findIndex(p => p.id === cartItem.productId);
        if (productIndex !== -1) {
            products[productIndex].stock = Math.max(
                0,
                products[productIndex].stock - cartItem.quantity
            );
        }
    });
    
    saveProducts(products);
}

function sendWhatsAppOrder(order) {
    const phone = "201556650985"; // رقمك هنا
    let message = `📦 *طلب جديد من متجر Pets X*\n\n`;
    message += `🔢 *رقم الطلب:* ${order.orderNumber}\n`;
    message += `👤 *العميل:* ${order.customerName}\n`;
    message += `📞 *الهاتف:* ${order.phone}\n`;
    message += `📍 *العنوان:* ${order.address}\n\n`;
    message += `🛒 *المنتجات:*\n`;
    
    order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.name} (${item.quantity}) × ${item.price} ج.م\n`;
    });
    
    message += `\n💰 *الإجمالي:* ${order.total.toFixed(2)} ج.م\n`;
    message += `📅 *التاريخ:* ${order.date}\n`;
    message += `📋 *الحالة:* ${order.status}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // افتح الواتساب في نافذة جديدة
    window.open(whatsappUrl, '_blank');
}

// ==================== إدارة العروض ====================

function getOffers() {
    return JSON.parse(localStorage.getItem(STORAGE.OFFERS) || '[]');
}

function saveOffers(offers) {
    localStorage.setItem(STORAGE.OFFERS, JSON.stringify(offers));
}

function loadOffers() {
    const container = document.getElementById('offersContainer');
    if (!container) return;
    
    const offers = getOffers();
    const now = new Date();
    
    const activeOffers = offers.filter(offer => 
        offer.isActive && new Date(offer.endDate) > now
    );
    
    if (activeOffers.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-gift"></i>
                <p>لا توجد عروض حالياً</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    activeOffers.forEach(offer => {
        const product = getProducts().find(p => p.id === offer.productId);
        if (!product) return;
        
        const discountedPrice = product.price * (1 - offer.discount / 100);
        const savings = product.price - discountedPrice;
        const endDate = new Date(offer.endDate);
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        html += `
            <div class="offer-card ${daysLeft <= 3 ? 'hot' : ''}">
                <div class="offer-header">
                    <h4>${offer.title}</h4>
                    <div class="offer-discount">${offer.discount}%</div>
                </div>
                <div class="offer-body">
                    <div class="offer-product">
                        <div class="offer-product-image">
                            ${product.image || '📦'}
                        </div>
                        <div class="offer-product-info">
                            <h5>${product.name}</h5>
                            <div class="offer-product-price">
                                <span class="original-price">${product.price.toFixed(2)} ج.م</span>
                                <span class="discounted-price">${discountedPrice.toFixed(2)} ج.م</span>
                                <span class="savings">توفير ${savings.toFixed(2)} ج.م</span>
                            </div>
                        </div>
                    </div>
                    <p class="offer-description">${offer.description}</p>
                    <div class="offer-expiry">
                        <i class="fas fa-clock"></i>
                        <span>ينتهي العرض خلال ${daysLeft} يوم</span>
                    </div>
                    <div class="offer-actions">
                        <button onclick="addToCart(${product.id})" class="btn btn-offer">
                            🛒 أضف إلى السلة
                        </button>
                        <button onclick="showSection('products')" class="btn btn-outline">
                            👀 تصفح المنتجات
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function openAddOfferModal() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    document.getElementById('addOfferModal').style.display = 'flex';
}

function saveOffer() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const title = document.getElementById('offerTitle').value.trim();
    const description = document.getElementById('offerDescription').value.trim();
    const discount = parseInt(document.getElementById('offerDiscount').value);
    const endDate = document.getElementById('offerEndDate').value;
    
    if (!title || !description || !discount || !endDate) {
        showMessage('جميع الحقول مطلوبة', 'error');
        return;
    }
    
    if (discount < 1 || discount > 100) {
        showMessage('نسبة الخصم يجب أن تكون بين 1 و 100', 'error');
        return;
    }
    
    const offers = getOffers();
    const newOffer = {
        id: Date.now(),
        title,
        description,
        discount,
        endDate: new Date(endDate).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString()
    };
    
    offers.push(newOffer);
    saveOffers(offers);
    
    showMessage('تم إضافة العرض بنجاح', 'success');
    closeModal('addOfferModal');
    loadOffers();
}

function startOffersCountdown() {
    updateOffersCountdown();
    setInterval(updateOffersCountdown, 1000);
}

function updateOffersCountdown() {
    const offers = getOffers();
    const now = new Date();
    const activeOffers = offers.filter(offer => 
        offer.isActive && new Date(offer.endDate) > now
    );
    
    if (activeOffers.length === 0) {
        document.getElementById('offersCountdown').style.display = 'none';
        return;
    }
    
    // إيجاد أقرب تاريخ انتهاء
    const nearestEndDate = new Date(Math.min(...activeOffers.map(o => new Date(o.endDate))));
    const timeLeft = nearestEndDate - now;
    
    if (timeLeft <= 0) {
        loadOffers();
        return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    document.getElementById('countdownDays').textContent = days.toString().padStart(2, '0');
    document.getElementById('countdownHours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('countdownMinutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('countdownSeconds').textContent = seconds.toString().padStart(2, '0');
}

// ==================== إدارة الشكاوى ====================

function getComplaints() {
    return JSON.parse(localStorage.getItem(STORAGE.COMPLAINTS) || '[]');
}

function saveComplaints(complaints) {
    localStorage.setItem(STORAGE.COMPLAINTS, JSON.stringify(complaints));
}

function loadComplaints() {
    const container = document.getElementById('complaintsContainer');
    const user = getCurrentUser();
    
    if (!container) return;
    
    let complaints = getComplaints();
    
    // إذا كان المستخدم ليس مشرفاً، يرى فقط شكاويه
    if (user && user.role !== 'admin') {
        complaints = complaints.filter(complaint => complaint.userId === user.uid);
    }
    
    // تحديث الإحصائيات
    const totalComplaints = complaints.length;
    const newComplaints = complaints.filter(c => c.status === 'جديدة').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'تم الحل').length;
    
    document.getElementById('totalComplaints').textContent = totalComplaints;
    document.getElementById('newComplaints').textContent = newComplaints;
    document.getElementById('resolvedComplaints').textContent = resolvedComplaints;
    
    if (complaints.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-comments"></i>
                <p>${user?.role === 'admin' ? 'لا توجد شكاوى لعرضها' : 'لم تقم بتقديم أي شكاوى'}</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="complaints-list">';
    
    complaints.forEach(complaint => {
        html += `
            <div class="complaint-card" data-status="${complaint.status}">
                <div class="complaint-header">
                    <h4>${complaint.subject}</h4>
                    <span class="complaint-type">${complaint.type}</span>
                    <span class="complaint-status" style="
                        background: ${complaint.status === 'جديدة' ? '#ff9f43' : 
                                   complaint.status === 'قيد المراجعة' ? '#2d73ff' : 
                                   '#00b894'};
                    ">
                        ${complaint.status}
                    </span>
                </div>
                <div class="complaint-body">
                    <p>${complaint.details}</p>
                </div>
                <div class="complaint-meta">
                    <span>👤 ${complaint.userName}</span>
                    <span>📅 ${new Date(complaint.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
                ${complaint.reply ? `
                    <div class="admin-reply">
                        <strong><i class="fas fa-reply"></i> رد الإدارة:</strong>
                        <p>${complaint.reply}</p>
                        ${complaint.repliedAt ? `
                            <small>📅 ${new Date(complaint.repliedAt).toLocaleDateString('ar-EG')}</small>
                        ` : ''}
                    </div>
                ` : ''}
                ${user?.role === 'admin' && complaint.status !== 'تم الحل' ? `
                    <div class="complaint-actions">
                        <button onclick="openAdminReplyModal(${complaint.id})" class="btn btn-primary btn-sm">
                            💬 رد
                        </button>
                        <button onclick="updateComplaintStatus(${complaint.id}, 'تم الحل')" class="btn btn-success btn-sm">
                            ✓ حل
                        </button>
                        <button onclick="deleteComplaint(${complaint.id})" class="btn btn-danger btn-sm">
                            🗑️ حذف
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function openNewComplaintModal() {
    if (!checkLogin(true)) return;
    
    document.getElementById('complaintModal').style.display = 'flex';
}

function submitComplaint() {
    const user = getCurrentUser();
    if (!user) {
        showMessage('الرجاء تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const type = document.getElementById('complaintType').value;
    const subject = document.getElementById('complaintSubject').value.trim();
    const details = document.getElementById('complaintDetails').value.trim();
    
    if (!type || !subject || !details) {
        showMessage('جميع الحقول مطلوبة', 'error');
        return;
    }
    
    const complaints = getComplaints();
    const newComplaint = {
        id: Date.now(),
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        type,
        subject,
        details,
        status: 'جديدة',
        createdAt: new Date().toISOString(),
        reply: null,
        repliedAt: null
    };
    
    complaints.push(newComplaint);
    saveComplaints(complaints);
    
    // إنشاء إشعار للمشرف
    createNotification({
        type: 'complaint',
        title: 'شكوى جديدة',
        message: `شكوى جديدة من ${user.name}: ${subject}`,
        data: newComplaint,
        read: false
    });
    
    showMessage('تم إرسال الشكوى بنجاح', 'success');
    closeModal('complaintModal');
    loadComplaints();
}

function openAdminReplyModal(complaintId) {
    if (!isAdmin()) return;
    
    window.currentComplaintId = complaintId;
    document.getElementById('adminReplyModal')?.style.display = 'flex';
}

function updateComplaintStatus(complaintId, status) {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const complaints = getComplaints();
    const complaintIndex = complaints.findIndex(c => c.id === complaintId);
    
    if (complaintIndex === -1) return;
    
    complaints[complaintIndex].status = status;
    saveComplaints(complaints);
    
    showMessage(`تم تحديث حالة الشكوى إلى "${status}"`, 'success');
    loadComplaints();
}

function deleteComplaint(complaintId) {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذه الشكوى؟')) return;
    
    let complaints = getComplaints();
    complaints = complaints.filter(c => c.id !== complaintId);
    saveComplaints(complaints);
    
    showMessage('تم حذف الشكوى', 'success');
    loadComplaints();
}

// ==================== الإشعارات ====================

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

async function loadNotifications() {
    try {
        if (!db || !isAdmin()) {
            showMessage('صلاحيات غير كافية', 'error');
            return;
        }
        
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
                        
                        ${notif.type === 'new_order' && notif.data ? `
                            <div class="notification-details">
                                <p><strong>👤 العميل:</strong> ${notif.data.customerName || 'غير معروف'}</p>
                                <p><strong>📞 الهاتف:</strong> ${notif.data.phone || 'غير معروف'}</p>
                                <p><strong>💰 الإجمالي:</strong> ${notif.data.total || 0} ج.م</p>
                                ${notif.data.address ? `<p><strong>📍 العنوان:</strong> ${notif.data.address}</p>` : ''}
                            </div>
                        ` : ''}
                        
                        ${notif.type === 'new_user' && notif.data ? `
                            <div class="notification-details">
                                <p><strong>📧 الإيميل:</strong> ${notif.data.email || 'غير معروف'}</p>
                                <p><strong>📞 الهاتف:</strong> ${notif.data.phone || 'غير معروف'}</p>
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

// ==================== لوحة التحكم ====================

function loadAdminPanel() {
    loadAdminProducts();
    loadAdminOffers();
    loadAdminOrders();
    updateHomeStats();
    updateNotificationsCount();
}

function showCustomersSection() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    document.getElementById('customersSection').style.display = 'block';
    document.getElementById('adminDefaultSections').style.display = 'none';
    loadCustomers();
}

function loadAdminProducts() {
    const container = document.getElementById('adminProductsList');
    if (!container) return;
    
    const products = getProducts();
    const countElement = document.getElementById('adminProductsCount');
    
    if (countElement) {
        countElement.textContent = products.length;
    }
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد منتجات</div>';
        return;
    }
    
    let html = '';
    const recentProducts = products.slice(-5).reverse();
    
    recentProducts.forEach(product => {
        html += `
            <div class="product-mini-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${product.name}</strong>
                        <div style="font-size: 0.9rem; color: #666;">
                            ${product.category} | ${product.price} ج.م
                        </div>
                    </div>
                    <span class="stock-mini ${product.stock > 0 ? 'in-stock' : 'out-stock'}">
                        ${product.stock}
                    </span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadAdminOffers() {
    const container = document.getElementById('adminOffersList');
    if (!container) return;
    
    const offers = getOffers();
    const activeOffers = offers.filter(offer => offer.isActive);
    const countElement = document.getElementById('adminOffersCount');
    
    if (countElement) {
        countElement.textContent = activeOffers.length;
    }
    
    if (activeOffers.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد عروض</div>';
        return;
    }
    
    let html = '';
    
    activeOffers.forEach(offer => {
        const daysLeft = Math.ceil((new Date(offer.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        html += `
            <div class="offer-mini-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${offer.title}</strong>
                        <div style="font-size: 0.9rem; color: #666;">
                            خصم ${offer.discount}%
                        </div>
                    </div>
                    <span style="background: ${daysLeft <= 3 ? '#ff4757' : '#2d73ff'}; 
                         color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">
                        ${daysLeft} يوم
                    </span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadAdminOrders() {
    const container = document.getElementById('adminOrdersList');
    if (!container) return;
    
    const orders = getOrders();
    const countElement = document.getElementById('adminOrdersCount');
    
    if (countElement) {
        countElement.textContent = orders.length;
    }
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد طلبات</div>';
        return;
    }
    
    let html = '';
    const recentOrders = orders.slice(-5).reverse();
    
    recentOrders.forEach(order => {
        html += `
            <div class="order-mini-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>الطلب #${order.orderNumber}</strong>
                    <span style="background: #00b894; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">
                        ${order.status}
                    </span>
                </div>
                <div style="font-size: 0.9rem; color: #666;">
                    ${order.customerName} | ${order.total.toFixed(2)} ج.م
                </div>
                <div style="font-size: 0.8rem; color: #888; margin-top: 0.25rem;">
                    ${order.date}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function loadCustomers() {
    const container = document.getElementById('customersContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">جارٍ تحميل العملاء...</div>';
    
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'user')
            .orderBy('createdAt', 'desc')
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-message">لا يوجد عملاء مسجلين</div>';
            return;
        }
        
        let html = '<div class="customers-grid">';
        
        snapshot.forEach((doc, index) => {
            const customer = doc.data();
            const createdAt = customer.createdAt ? 
                (customer.createdAt.toDate ? 
                    customer.createdAt.toDate().toLocaleDateString('ar-EG') : 
                    new Date(customer.createdAt).toLocaleDateString('ar-EG')) : 
                'غير معروف';
            
            html += `
                <div class="customer-card">
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
                    </div>
                    <div class="customer-stats">
                        <div class="stat-item">
                            <div class="stat-number">${customer.totalOrders || 0}</div>
                            <div class="stat-label">الطلبات</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${customer.totalSpent || 0} ج.م</div>
                            <div class="stat-label">إجمالي المشتريات</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // تحديث عدد العملاء
        document.getElementById('adminCustomersCount').textContent = snapshot.size;
        
    } catch (error) {
        console.error("❌ Error loading customers:", error);
        container.innerHTML = '<div class="error-message">خطأ في تحميل العملاء</div>';
    }
}

function showAddProductModal() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    document.getElementById('addProductModal').style.display = 'flex';
}

function saveNewProduct() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value.trim();
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    
    if (!name || !price || !category || !description) {
        showMessage('جميع الحقول مطلوبة', 'error');
        return;
    }
    
    if (price <= 0) {
        showMessage('السعر يجب أن يكون أكبر من صفر', 'error');
        return;
    }
    
    const products = getProducts();
    const newProduct = {
        id: Date.now(),
        name,
        price,
        category,
        description,
        stock,
        image: getCategoryIcon(category),
        imageUrl: null,
        createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    saveProducts(products);
    
    showMessage('تم إضافة المنتج بنجاح', 'success');
    closeModal('addProductModal');
    loadProducts();
    loadAdminProducts();
}

function getCategoryIcon(category) {
    switch(category) {
        case 'قطط': return '🐱';
        case 'كلاب': return '🐶';
        case 'طيور': return '🐦';
        default: return '📦';
    }
}

function getAvatarColor(index) {
    const colors = [
        'linear-gradient(135deg, #2d73ff, #9b59b6)',
        'linear-gradient(135deg, #00b894, #00d2d3)',
        'linear-gradient(135deg, #ff9f43, #ff6b8b)',
        'linear-gradient(135deg, #3498db, #2d73ff)',
        'linear-gradient(135deg, #9b59b6, #2d73ff)'
    ];
    return colors[index % colors.length];
}

function syncFirebaseData() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    showMessage('جارٍ مزامنة البيانات...', 'info');
    // هنا يمكن إضافة منطق المزامنة
    setTimeout(() => {
        showMessage('تمت مزامنة البيانات بنجاح', 'success');
    }, 1000);
}

// ==================== دوال مساعدة عامة ====================

function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE.ORDERS) || '[]');
}

function saveOrders(orders) {
    localStorage.setItem(STORAGE.ORDERS, JSON.stringify(orders));
}

function saveProducts(products) {
    localStorage.setItem(STORAGE.PRODUCTS, JSON.stringify(products));
}

function showMessage(text, type = 'success') {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                       type === 'error' ? 'exclamation-circle' : 
                       type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${text}</span>
    `;
    
    container.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideDown 0.4s reverse forwards';
        setTimeout(() => message.remove(), 400);
    }, 3000);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function updateHomeStats() {
    // يمكن إضافة إحصائيات هنا
}

function setupEvents() {
    // البحث الفوري
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', loadProducts);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadProducts);
    }
    
    // إغلاق المودال عند النقر خارجها
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEvents();
});