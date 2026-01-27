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
    OFFER_IMAGES: 'marwan_offer_images'
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

// ==================== التهيئة ====================
function initApp() {
    initStorage();
    setupEvents();
    updateUI();
    loadProducts();
    loadOffers();
    updateCartCount();
    startOffersCountdown();
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

// ==================== المنتجات ====================
function loadProducts() {
    const products = getProducts();
    const productImages = getProductImages();
    const container = document.getElementById('productsContainer');
    
    if (!container) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    let filteredProducts = products;
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product =>
            product.category === categoryFilter
        );
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد منتجات</div>';
        return;
    }
    
    container.innerHTML = filteredProducts.map(product => {
        const offer = getProductOffer(product.id);
        const discountedPrice = offer ? calculateDiscountedPrice(product.price, offer.discount) : null;
        const productImage = productImages[product.id] || product.imageUrl || product.image;
        const hasCustomImage = productImages[product.id] || product.imageUrl;
        
        return `
            <div class="product-card">
                <div class="product-image">
                    ${hasCustomImage ? 
                        `<img src="${productImage}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 
                        product.image
                    }
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="category">${product.category}</p>
                    <p class="description">${product.description || ''}</p>
                    <div class="price-stock">
                        ${offer ? `
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <span style="text-decoration: line-through; color: #666; font-size: 0.9rem;">
                                    ${product.price} ج.م
                                </span>
                                <span class="price" style="color: #ff4757; font-size: 1.3rem;">
                                    ${discountedPrice} ج.م
                                </span>
                                <span style="background: #ff4757; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.8rem;">
                                    خصم ${offer.discount}%
                                </span>
                            </div>
                        ` : `
                            <span class="price">${product.price} ج.م</span>
                        `}
                        <span class="stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}">
                            ${product.stock > 0 ? '🟢 متوفر' : '🔴 غير متوفر'}
                        </span>
                    </div>
                    <div class="product-actions">
                        <button onclick="addToCart(${product.id})" class="btn add-to-cart" ${product.stock === 0 ? 'disabled' : ''}>
                            ${product.stock > 0 ? '🛒 إضافة للسلة' : '⛔ غير متوفر'}
                        </button>
                        ${isAdmin() ? `
                            <button onclick="editProduct(${product.id})" class="btn btn-warning btn-sm">
                                ✏️ تعديل
                            </button>
                            <button onclick="deleteProduct(${product.id})" class="btn btn-danger btn-sm">
                                🗑️ حذف
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getProductOffer(productId) {
    const offers = getOffers();
    const now = new Date();
    
    return offers.find(offer => 
        offer.productId === productId && 
        offer.isActive && 
        new Date(offer.endDate) > now
    );
}

function calculateDiscountedPrice(price, discount) {
    return Math.round(price - (price * discount / 100));
}

function addToCart(productId) {
    if (!checkLogin(true)) return;
    
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product || product.stock === 0) {
        showMessage('المنتج غير متوفر', 'error');
        return;
    }
    
    const offer = getProductOffer(productId);
    const finalPrice = offer ? calculateDiscountedPrice(product.price, offer.discount) : product.price;
    
    const cart = getCart();
    const existing = cart.find(item => item.productId === productId);
    
    if (existing) {
        existing.quantity += 1;
        existing.price = finalPrice;
    } else {
        cart.push({
            id: Date.now(),
            productId,
            productName: product.name,
            price: finalPrice,
            quantity: 1,
            originalPrice: product.price,
            hasOffer: !!offer
        });
    }
    
    saveCart(cart);
    showMessage('تمت الإضافة للسلة', 'success');
    loadCart();
}

// ==================== إدارة المنتجات ====================
function showAddProductModal() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const modal = document.getElementById('addProductModal');
    if (!modal) return;
    
    // إعادة تعيين الحقول
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductPrice').value = '';
    document.getElementById('newProductCategory').value = 'قطط';
    document.getElementById('newProductDescription').value = '';
    document.getElementById('newProductStock').value = '10';
    
    // إعادة تعيين بيانات الصورة
    productImageData = {
        productId: null,
        imageUrl: null,
        imageFile: null
    };
    
    document.getElementById('productImageStatus').textContent = 'لم يتم رفع صورة بعد';
    document.getElementById('productImageStatus').style.color = '#666';
    
    modal.style.display = 'flex';
}

function openProductImageUpload() {
    productImageData.productId = null; // للمنتج الجديد
    const modal = document.getElementById('productImageUploadModal');
    if (modal) {
        modal.style.display = 'flex';
        // إعادة تعيين الحقول
        document.getElementById('productImageFile').value = '';
        document.getElementById('productImageUrl').value = '';
        document.getElementById('productImagePreview').style.display = 'none';
        document.getElementById('previewImage').src = '';
    }
}

function previewProductImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            productImageData.imageFile = e.target.result;
            productImageData.imageUrl = null;
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('productImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function saveProductImage() {
    const imageUrl = document.getElementById('productImageUrl')?.value.trim();
    
    if (imageUrl) {
        productImageData.imageUrl = imageUrl;
        productImageData.imageFile = null;
        showMessage('تم حفظ رابط الصورة', 'success');
    } else if (productImageData.imageFile) {
        showMessage('تم حفظ الصورة', 'success');
    } else {
        showMessage('يرجى رفع صورة أو إدخال رابط', 'error');
        return;
    }
    
    closeModal('productImageUploadModal');
    document.getElementById('productImageStatus').textContent = productImageData.imageUrl || 'تم رفع صورة';
    document.getElementById('productImageStatus').style.color = '#00b894';
}

function saveNewProduct() {
    const name = document.getElementById('newProductName')?.value.trim();
    const price = parseFloat(document.getElementById('newProductPrice')?.value);
    const category = document.getElementById('newProductCategory')?.value;
    const description = document.getElementById('newProductDescription')?.value.trim();
    const stock = parseInt(document.getElementById('newProductStock')?.value);
    
    // التحقق من البيانات
    if (!name || !price || !category) {
        showMessage('اسم المنتج والسعر والفئة مطلوبة', 'error');
        return;
    }
    
    if (price <= 0) {
        showMessage('السعر يجب أن يكون أكبر من صفر', 'error');
        return;
    }
    
    if (stock < 0) {
        showMessage('الكمية لا يمكن أن تكون سالبة', 'error');
        return;
    }
    
    // إضافة المنتج الجديد
    const products = getProducts();
    const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        category: category,
        description: description || '',
        image: '📦', // رمز افتراضي
        imageUrl: productImageData.imageUrl || null,
        stock: stock || 0,
        createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    saveProducts(products);
    
    // حفظ صورة المنتج إذا كانت موجودة
    if (productImageData.imageFile || productImageData.imageUrl) {
        const productImages = getProductImages();
        productImages[newProduct.id] = productImageData.imageFile || productImageData.imageUrl;
        saveProductImages(productImages);
    }
    
    showMessage('تم إضافة المنتج بنجاح', 'success');
    closeModal('addProductModal');
    
    // تحديث العرض
    loadProducts();
    if (document.getElementById('adminProductsList')) {
        loadAdminProducts();
    }
    
    // تحديث الإحصائيات
    updateHomeStats();
}

function editProduct(productId) {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // يمكنك إضافة مودال للتعديل هنا
    showMessage('ميزة التعديل قيد التطوير', 'info');
}

function deleteProduct(productId) {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    
    const products = getProducts();
    const filteredProducts = products.filter(p => p.id !== productId);
    saveProducts(filteredProducts);
    
    // حذف العروض المرتبطة بهذا المنتج
    const offers = getOffers();
    const updatedOffers = offers.filter(offer => offer.productId !== productId);
    saveOffers(updatedOffers);
    
    // حذف صورة المنتج
    const productImages = getProductImages();
    if (productImages[productId]) {
        delete productImages[productId];
        saveProductImages(productImages);
    }
    
    showMessage('تم حذف المنتج بنجاح', 'success');
    
    // تحديث جميع الأقسام
    loadProducts();
    if (document.getElementById('adminProductsList')) {
        loadAdminProducts();
    }
    if (document.getElementById('adminOffersList')) {
        loadAdminOffers();
    }
    if (document.getElementById('offersContainer')) {
        loadOffers();
    }
    
    // تحديث الإحصائيات
    updateHomeStats();
}

function updateHomeStats() {
    const products = getProducts();
    const orders = getOrders();
    const customers = getCustomers();
    
    if (document.getElementById('totalProducts')) {
        document.getElementById('totalProducts').textContent = products.length;
    }
    if (document.getElementById('totalOrders')) {
        document.getElementById('totalOrders').textContent = orders.length;
    }
    if (document.getElementById('totalCustomers')) {
        document.getElementById('totalCustomers').textContent = customers.length;
    }
    
    // تحديث إحصائيات لوحة التحكم
    if (document.getElementById('adminProductsCount')) {
        document.getElementById('adminProductsCount').textContent = products.length;
    }
    if (document.getElementById('adminOrdersCount')) {
        document.getElementById('adminOrdersCount').textContent = orders.length;
    }
    if (document.getElementById('adminOffersCount')) {
        const offers = getOffers().filter(o => o.isActive);
        document.getElementById('adminOffersCount').textContent = offers.length;
    }
    if (document.getElementById('adminCustomersCount')) {
        document.getElementById('adminCustomersCount').textContent = customers.length;
    }
}

// ==================== السلة ====================
function loadCart() {
    const cart = getCart();
    const container = document.getElementById('cartContainer');
    const summary = document.getElementById('orderSummary');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-message">السلة فارغة</p>';
        if (summary) summary.style.display = 'none';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    let savings = 0;
    
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        if (item.hasOffer) {
            savings += (item.originalPrice - item.price) * item.quantity;
        }
        
        return `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${item.productName}</h4>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        ${item.hasOffer ? `
                            <span style="text-decoration: line-through; color: #666; font-size: 0.9rem;">
                                ${item.originalPrice} ج.م
                            </span>
                        ` : ''}
                        <span>${item.price} ج.م × ${item.quantity}</span>
                        ${item.hasOffer ? `
                            <span style="background: #00b894; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.8rem;">
                                وفرت ${(item.originalPrice - item.price) * item.quantity} ج.م
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})" class="btn qty-btn">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})" class="btn qty-btn">+</button>
                    <button onclick="removeFromCart(${item.id})" class="btn btn-danger btn-sm">🗑️</button>
                </div>
                <div class="item-total">${itemTotal} ج.م</div>
            </div>
        `;
    }).join('');
    
    if (summary) {
        let summaryHTML = `
            <h3>ملخص الطلب</h3>
            <div class="summary-row">
                <span>الإجمالي:</span>
                <span id="totalAmount">${total} ج.م</span>
            </div>
        `;
        
        if (savings > 0) {
            summaryHTML += `
                <div class="summary-row" style="color: #00b894;">
                    <span>التوفير:</span>
                    <span>${savings} ج.م</span>
                </div>
            `;
        }
        
        summary.innerHTML = summaryHTML;
        summary.style.display = 'block';
    }
    
    if (checkoutBtn) checkoutBtn.disabled = false;
}

function updateCartItem(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(itemId);
        return;
    }
    
    const cart = getCart();
    const item = cart.find(i => i.id === itemId);
    
    if (item) {
        item.quantity = newQuantity;
        saveCart(cart);
        loadCart();
    }
}

function removeFromCart(itemId) {
    if (!confirm('هل تريد إزالة هذا المنتج من السلة؟')) return;
    
    const cart = getCart().filter(item => item.id !== itemId);
    saveCart(cart);
    loadCart();
    showMessage('تمت الإزالة من السلة', 'success');
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = count;
}

// ==================== المستخدمين ====================
function login() {
    const email = document.getElementById('loginEmail')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMessage(`مرحباً بعودتك ${user.name}!`, 'success');
        updateUI();
        showSection('home');
        
        // إعادة تعيين حقول الدخول
        if (document.getElementById('loginEmail')) {
            document.getElementById('loginEmail').value = '';
        }
        if (document.getElementById('loginPassword')) {
            document.getElementById('loginPassword').value = '';
        }
    } else {
        showMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    showMessage('تم تسجيل الخروج', 'success');
    updateUI();
    showSection('home');
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function checkLogin(showAlert = false) {
    const user = getCurrentUser();
    
    if (!user && showAlert) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        showSection('login');
        return false;
    }
    
    return !!user;
}

function updateUI() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const adminLink = document.getElementById('adminLink');
    const complaintsLink = document.getElementById('complaintsLink');
    const addOfferBtn = document.getElementById('addOfferBtn');
    const newComplaintBtn = document.getElementById('newComplaintBtn');
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'inline-block';
            userInfo.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 5px 15px; border-radius: 20px;">
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
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (complaintsLink) complaintsLink.style.display = 'none';
        if (addOfferBtn) addOfferBtn.style.display = 'none';
        if (newComplaintBtn) newComplaintBtn.style.display = 'none';
    }
}

// ==================== إنشاء حساب جديد ====================
function register() {
    const name = document.getElementById('registerName')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const phone = document.getElementById('registerPhone')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirm = document.getElementById('registerConfirm')?.value;
    
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
        lastOrderDate: null
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    showMessage(`مرحباً ${name}! تم إنشاء حسابك بنجاح`, 'success');
    updateUI();
    showSection('home');
    resetRegisterForm();
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^01[0-9]{9}$/;
    return re.test(phone);
}

function resetRegisterForm() {
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPhone').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirm').value = '';
}

// ==================== الطلبات ====================
function checkout() {
    const cart = getCart();
    
    if (cart.length === 0) {
        showMessage('السلة فارغة', 'error');
        return;
    }
    
    const customerName = prompt('اسمك:');
    const phone = prompt('رقم الهاتف:');
    const address = prompt('العنوان:');
    
    if (!customerName || !phone || !address) {
        showMessage('البيانات غير مكتملة', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const user = getCurrentUser();
    
    const order = {
        id: Date.now(),
        orderNumber: 'ORD-' + Date.now(),
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
        userId: user?.id || null
    };
    
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
    
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
    
    // تفريغ السلة
    saveCart([]);
    
    // إرسال واتساب
    sendWhatsAppOrder(order);
    
    showMessage('تم تأكيد الطلب! سنتصل بك قريباً', 'success');
    showSection('home');
    updateHomeStats();
}

function sendWhatsAppOrder(order) {
    const phone = '201556650985'; // رقم واتساب المتجر
    
    const message = `طلب جديد #${order.orderNumber}
    
👤 العميل: ${order.customerName}
📞 الهاتف: ${order.phone}
📍 العنوان: ${order.address}
💰 الإجمالي: ${order.total} ج.م

${order.items.map(item => {
    let itemText = `• ${item.name} × ${item.quantity} = ${item.price * item.quantity} ج.م`;
    if (item.hasOffer) {
        itemText += ` (وفرت ${(item.originalPrice - item.price) * item.quantity} ج.م)`;
    }
    return itemText;
}).join('\n')}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ==================== نظام العروض ====================
function loadOffers() {
    const offers = getOffers();
    const products = getProducts();
    const offerImages = getOfferImages();
    const now = new Date();
    
    const activeOffers = offers.filter(offer => 
        offer.isActive && new Date(offer.endDate) > now
    );
    
    const container = document.getElementById('offersContainer');
    if (!container) return;
    
    if (activeOffers.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد عروض حالياً</div>';
        return;
    }
    
    updateOffersCountdown(activeOffers);
    
    container.innerHTML = activeOffers.map(offer => {
        const product = products.find(p => p.id === offer.productId);
        if (!product) {
            return `<div class="empty-message">المنتج المرتبط بهذا العرض غير موجود</div>`;
        }
        
        const endDate = new Date(offer.endDate);
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        const isHot = daysLeft <= 1;
        
        const discountedPrice = calculateDiscountedPrice(product.price, offer.discount);
        const savings = product.price - discountedPrice;
        
        const offerImage = offerImages[offer.id] || offer.imageUrl;
        const productImages = getProductImages();
        const productImage = productImages[product.id] || product.imageUrl || product.image;
        
        return `
            <div class="offer-card ${isHot ? 'hot' : ''}">
                <div class="offer-header">
                    <h4>${offer.title}</h4>
                    <div class="offer-discount">${offer.discount}%</div>
                </div>
                <div class="offer-body">
                    <div class="offer-product">
                        <div class="offer-product-image">
                            ${offerImage ? 
                                `<img src="${offerImage}" alt="${offer.title}" style="width:100%;height:100%;object-fit:cover;">` :
                                (productImage.includes('http') ? 
                                    `<img src="${productImage}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` :
                                    productImage)
                            }
                        </div>
                        <div class="offer-product-info">
                            <h5>${product.name}</h5>
                            <div class="offer-product-price">
                                <span class="original-price">${product.price} ج.م</span>
                                <span class="discounted-price">${discountedPrice} ج.م</span>
                                <span class="savings">وفر ${savings} ج.م</span>
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
                            🛒 أضف للسلة
                        </button>
                        ${isAdmin() ? `
                            <button onclick="deleteOffer(${offer.id})" class="btn btn-danger btn-sm">
                                🗑️ حذف
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openAddOfferModal() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const modal = document.getElementById('addOfferModal');
    if (!modal) return;
    
    const products = getProducts();
    const productSelect = document.getElementById('offerProduct');
    if (productSelect) {
        productSelect.innerHTML = `
            <option value="">اختر منتج</option>
            ${products.map(product => `
                <option value="${product.id}">${product.name} - ${product.price} ج.م</option>
            `).join('')}
        `;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const endDateInput = document.getElementById('offerEndDate');
    if (endDateInput) {
        endDateInput.min = today;
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        endDateInput.value = nextWeek.toISOString().split('T')[0];
    }
    
    // إعادة تعيين بيانات الصورة
    offerImageData = {
        offerId: null,
        imageUrl: null,
        imageFile: null
    };
    
    document.getElementById('offerImageStatus').textContent = 'لم يتم رفع صورة بعد';
    document.getElementById('offerImageStatus').style.color = '#666';
    
    modal.style.display = 'flex';
}

function openOfferImageUpload() {
    offerImageData.offerId = null; // للعرض الجديد
    const modal = document.getElementById('offerImageUploadModal');
    if (modal) {
        modal.style.display = 'flex';
        // إعادة تعيين الحقول
        document.getElementById('offerImageFile').value = '';
        document.getElementById('offerImageUrl').value = '';
        document.getElementById('offerImagePreview').style.display = 'none';
        document.getElementById('previewOfferImage').src = '';
    }
}

function previewOfferImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            offerImageData.imageFile = e.target.result;
            offerImageData.imageUrl = null;
            document.getElementById('previewOfferImage').src = e.target.result;
            document.getElementById('offerImagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function saveOfferImage() {
    const imageUrl = document.getElementById('offerImageUrl')?.value.trim();
    
    if (imageUrl) {
        offerImageData.imageUrl = imageUrl;
        offerImageData.imageFile = null;
        showMessage('تم حفظ رابط الصورة', 'success');
    } else if (offerImageData.imageFile) {
        showMessage('تم حفظ الصورة', 'success');
    } else {
        showMessage('يرجى رفع صورة أو إدخال رابط', 'error');
        return;
    }
    
    closeModal('offerImageUploadModal');
    document.getElementById('offerImageStatus').textContent = offerImageData.imageUrl || 'تم رفع صورة';
    document.getElementById('offerImageStatus').style.color = '#00b894';
}

function saveOffer() {
    const title = document.getElementById('offerTitle')?.value.trim();
    const productId = parseInt(document.getElementById('offerProduct')?.value);
    const discount = parseInt(document.getElementById('offerDiscount')?.value);
    const endDate = document.getElementById('offerEndDate')?.value;
    const description = document.getElementById('offerDescription')?.value.trim();
    
    if (!title || !productId || !discount || !endDate) {
        showMessage('جميع الحقول مطلوبة', 'error');
        return;
    }
    
    if (discount < 1 || discount > 100) {
        showMessage('نسبة الخصم يجب أن تكون بين 1% و 100%', 'error');
        return;
    }
    
    const offers = getOffers();
    const newOffer = {
        id: Date.now(),
        title,
        productId,
        discount,
        endDate: new Date(endDate).toISOString(),
        description: description || '',
        imageUrl: offerImageData.imageUrl || null,
        isActive: true,
        createdAt: new Date().toISOString()
    };
    
    offers.push(newOffer);
    saveOffers(offers);
    
    // حفظ صورة العرض إذا كانت موجودة
    if (offerImageData.imageFile || offerImageData.imageUrl) {
        const offerImages = getOfferImages();
        offerImages[newOffer.id] = offerImageData.imageFile || offerImageData.imageUrl;
        saveOfferImages(offerImages);
    }
    
    closeModal('addOfferModal');
    showMessage('تم إضافة العرض بنجاح', 'success');
    loadOffers();
    loadProducts();
}

function deleteOffer(offerId) {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    if (!confirm('هل تريد حذف هذا العرض؟')) return;
    
    const offers = getOffers().filter(offer => offer.id !== offerId);
    saveOffers(offers);
    
    // حذف صورة العرض
    const offerImages = getOfferImages();
    if (offerImages[offerId]) {
        delete offerImages[offerId];
        saveOfferImages(offerImages);
    }
    
    showMessage('تم حذف العرض', 'success');
    loadOffers();
    loadProducts();
}

function startOffersCountdown() {
    setInterval(updateOffersCountdown, 1000);
}

function updateOffersCountdown(offers = null) {
    if (!offers) {
        offers = getOffers().filter(offer => offer.isActive);
    }
    
    if (offers.length === 0) return;
    
    const now = new Date();
    const endDates = offers.map(offer => new Date(offer.endDate));
    const nearestEndDate = new Date(Math.min(...endDates.map(d => d.getTime())));
    
    const timeLeft = nearestEndDate - now;
    
    if (timeLeft <= 0) {
        if (document.getElementById('offersCountdown')) {
            document.getElementById('offersCountdown').innerHTML = `
                <div style="text-align: center; width: 100%;">
                    <h4>⏰ انتهت العروض</h4>
                    <p>ترقبوا عروضنا القادمة!</p>
                </div>
            `;
        }
        return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (document.getElementById('countdownDays')) {
        document.getElementById('countdownDays').textContent = days.toString().padStart(2, '0');
    }
    if (document.getElementById('countdownHours')) {
        document.getElementById('countdownHours').textContent = hours.toString().padStart(2, '0');
    }
    if (document.getElementById('countdownMinutes')) {
        document.getElementById('countdownMinutes').textContent = minutes.toString().padStart(2, '0');
    }
    if (document.getElementById('countdownSeconds')) {
        document.getElementById('countdownSeconds').textContent = seconds.toString().padStart(2, '0');
    }
}

// ==================== نظام الشكاوى ====================
function loadComplaints() {
    const user = getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const complaints = getComplaints();
    
    const userComplaints = isAdmin 
        ? complaints 
        : complaints.filter(c => c.userId === user.id);
    
    if (document.getElementById('totalComplaints')) {
        document.getElementById('totalComplaints').textContent = userComplaints.length;
    }
    if (document.getElementById('newComplaints')) {
        document.getElementById('newComplaints').textContent = userComplaints.filter(c => c.status === 'جديدة').length;
    }
    if (document.getElementById('resolvedComplaints')) {
        document.getElementById('resolvedComplaints').textContent = userComplaints.filter(c => c.status === 'تم الحل').length;
    }
    
    const container = document.getElementById('complaintsContainer');
    
    if (userComplaints.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد شكاوى لعرضها</div>';
        return;
    }
    
    let html = '<div class="complaints-list">';
    
    userComplaints.forEach(complaint => {
        const statusColors = {
            'جديدة': '#ff9f43',
            'قيد المراجعة': '#3498db',
            'تم الحل': '#00b894'
        };
        
        html += `
            <div class="complaint-card">
                <div class="complaint-header">
                    <h4>${complaint.title}</h4>
                    <span class="complaint-type">${complaint.type}</span>
                    <span class="complaint-status" style="background: ${statusColors[complaint.status] || '#999'}">
                        ${complaint.status}
                    </span>
                </div>
                <div class="complaint-body">
                    <p>${complaint.details}</p>
                    <div class="complaint-meta">
                        <small>${isAdmin ? `المستخدم: ${complaint.userName}` : ''}</small>
                        <small>التاريخ: ${formatDate(complaint.createdAt)}</small>
                    </div>
                    
                    ${complaint.adminReply ? `
                        <div class="admin-reply">
                            <strong>📤 رد الإدارة:</strong>
                            <p>${complaint.adminReply}</p>
                        </div>
                    ` : ''}
                </div>
                
                ${isAdmin && complaint.status !== 'تم الحل' ? `
                    <div class="complaint-actions">
                        <button onclick="updateComplaintStatus(${complaint.id}, 'قيد المراجعة')" 
                                class="btn btn-warning btn-sm">
                            قيد المراجعة
                        </button>
                        <button onclick="openAdminReplyModal(${complaint.id})" 
                                class="btn btn-primary btn-sm">
                            الرد
                        </button>
                        <button onclick="updateComplaintStatus(${complaint.id}, 'تم الحل')" 
                                class="btn btn-success btn-sm">
                            تم الحل
                        </button>
                        <button onclick="deleteComplaint(${complaint.id})" 
                                class="btn btn-danger btn-sm">
                            حذف
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
    
    const modal = document.getElementById('complaintModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
}

function submitComplaint() {
    const user = getCurrentUser();
    if (!user) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const title = document.getElementById('complaintTitle')?.value.trim();
    const details = document.getElementById('complaintDetails')?.value.trim();
    const type = document.getElementById('complaintType')?.value;
    
    if (!title || !details) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const complaints = getComplaints();
    const newComplaint = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: type || 'شكوى',
        title: title,
        details: details,
        status: 'جديدة',
        adminReply: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    complaints.push(newComplaint);
    saveComplaints(complaints);
    
    closeModal('complaintModal');
    showMessage('تم إرسال شكواك بنجاح، سنقوم بالرد قريباً', 'success');
    loadComplaints();
}

function openAdminReplyModal(complaintId) {
    const modal = document.getElementById('adminReplyModal');
    if (!modal) return;
    
    modal.dataset.complaintId = complaintId;
    modal.style.display = 'flex';
    document.getElementById('adminReplyText').value = '';
}

function saveAdminReply() {
    const modal = document.getElementById('adminReplyModal');
    if (!modal) return;
    
    const complaintId = parseInt(modal.dataset.complaintId);
    const reply = document.getElementById('adminReplyText')?.value.trim();
    
    if (!reply) {
        showMessage('يرجى كتابة رد', 'error');
        return;
    }
    
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === complaintId);
    
    if (complaint) {
        complaint.adminReply = reply;
        complaint.status = 'تم الحل';
        complaint.updatedAt = new Date().toISOString();
        saveComplaints(complaints);
        
        closeModal('adminReplyModal');
        showMessage('تم حفظ الرد', 'success');
        loadComplaints();
    }
}

function updateComplaintStatus(complaintId, status) {
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === complaintId);
    
    if (complaint) {
        complaint.status = status;
        complaint.updatedAt = new Date().toISOString();
        saveComplaints(complaints);
        
        showMessage('تم تحديث حالة الشكوى', 'success');
        loadComplaints();
    }
}

function deleteComplaint(complaintId) {
    if (!confirm('هل تريد حذف هذه الشكوى؟')) return;
    
    const complaints = getComplaints().filter(c => c.id !== complaintId);
    saveComplaints(complaints);
    
    showMessage('تم حذف الشكوى', 'success');
    loadComplaints();
}

// ==================== إدارة العملاء ====================
function showCustomersSection() {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    document.getElementById('customersSection').style.display = 'block';
    document.getElementById('adminDefaultSections').style.display = 'none';
    loadCustomers();
}

function loadCustomers() {
    const customers = getCustomers();
    const orders = getOrders();
    const container = document.getElementById('customersContainer');
    
    if (!container) return;
    
    if (customers.length === 0) {
        container.innerHTML = '<div class="empty-message">لا يوجد عملاء مسجلين</div>';
        return;
    }
    
    container.innerHTML = customers.map(customer => {
        const customerOrders = orders.filter(order => order.userId === customer.id);
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
        const lastOrder = customerOrders.length > 0 ? 
            new Date(customerOrders[customerOrders.length - 1].date).toLocaleDateString('ar-EG') : 
            'لا توجد طلبات';
        
        const firstName = customer.name.split(' ')[0];
        const avatarColor = getAvatarColor(customer.id);
        
        return `
            <div class="customer-card" onclick="showCustomerDetails(${customer.id})">
                <div class="customer-header">
                    <div class="customer-avatar" style="background: ${avatarColor};">
                        ${firstName.charAt(0)}
                    </div>
                    <div>
                        <h4>${customer.name}</h4>
                        <p class="customer-email">${customer.email}</p>
                    </div>
                </div>
                <div class="customer-details">
                    <div class="detail-item">
                        <span class="detail-label">📞 الهاتف</span>
                        <span class="detail-value">${customer.phone}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📅 التسجيل</span>
                        <span class="detail-value">${formatDate(customer.createdAt)}</span>
                    </div>
                </div>
                <div class="customer-stats">
                    <div class="stat-item">
                        <div class="stat-number">${customerOrders.length}</div>
                        <div class="stat-label">الطلبات</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${totalSpent} ج.م</div>
                        <div class="stat-label">إجمالي المشتريات</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch')?.value.toLowerCase() || '';
    const customers = getCustomers();
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm)
    );
    
    const container = document.getElementById('customersContainer');
    
    if (filteredCustomers.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد نتائج</div>';
        return;
    }
    
    const orders = getOrders();
    container.innerHTML = filteredCustomers.map(customer => {
        const customerOrders = orders.filter(order => order.userId === customer.id);
        const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
        const firstName = customer.name.split(' ')[0];
        const avatarColor = getAvatarColor(customer.id);
        
        return `
            <div class="customer-card" onclick="showCustomerDetails(${customer.id})">
                <div class="customer-header">
                    <div class="customer-avatar" style="background: ${avatarColor};">
                        ${firstName.charAt(0)}
                    </div>
                    <div>
                        <h4>${customer.name}</h4>
                        <p class="customer-email">${customer.email}</p>
                    </div>
                </div>
                <div class="customer-details">
                    <div class="detail-item">
                        <span class="detail-label">📞 الهاتف</span>
                        <span class="detail-value">${customer.phone}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📅 التسجيل</span>
                        <span class="detail-value">${formatDate(customer.createdAt)}</span>
                    </div>
                </div>
                <div class="customer-stats">
                    <div class="stat-item">
                        <div class="stat-number">${customerOrders.length}</div>
                        <div class="stat-label">الطلبات</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${totalSpent} ج.م</div>
                        <div class="stat-label">إجمالي المشتريات</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showCustomerDetails(customerId) {
    if (!isAdmin()) {
        showMessage('صلاحيات غير كافية', 'error');
        return;
    }
    
    const customers = getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const orders = getOrders();
    const customerOrders = orders.filter(order => order.userId === customer.id);
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
    const lastOrder = customerOrders.length > 0 ? 
        formatDate(customerOrders[customerOrders.length - 1].date) : 
        'لا توجد طلبات';
    
    document.getElementById('customerDetailName').textContent = customer.name;
    document.getElementById('customerDetailEmail').textContent = customer.email;
    document.getElementById('customerDetailPhone').textContent = customer.phone;
    document.getElementById('customerDetailDate').textContent = formatDate(customer.createdAt);
    document.getElementById('customerDetailOrders').textContent = customerOrders.length;
    document.getElementById('customerDetailTotal').textContent = totalSpent + ' ج.م';
    
    const modal = document.getElementById('customerDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function getAvatarColor(id) {
    const colors = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)',
        'linear-gradient(135deg, #30cfd0, #330867)',
        'linear-gradient(135deg, #a8edea, #fed6e3)',
        'linear-gradient(135deg, #5ee7df, #b490ca)'
    ];
    return colors[id % colors.length];
}

// ==================== الأدوات المساعدة ====================
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

function loadAdminPanel() {
    loadAdminProducts();
    loadAdminOffers();
    loadAdminOrders();
    updateHomeStats();
}

function loadAdminProducts() {
    const products = getProducts();
    const productImages = getProductImages();
    const container = document.getElementById('adminProductsList');
    
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد منتجات</div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const productImage = productImages[product.id] || product.imageUrl || product.image;
        const hasCustomImage = productImages[product.id] || product.imageUrl;
        
        return `
            <div class="admin-product">
                <div class="product-icon">
                    ${hasCustomImage ? 
                        `<img src="${productImage}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">` : 
                        product.image
                    }
                </div>
                <div class="product-details">
                    <h4>${product.name}</h4>
                    <p>
                        <span class="product-price">${product.price} ج.م</span> | 
                        <span>${product.category}</span> | 
                        <span>المخزون: ${product.stock}</span>
                    </p>
                    ${product.description ? `<p style="color: #666; margin-top: 0.5rem;">${product.description}</p>` : ''}
                </div>
                <div class="admin-product-actions">
                    <button onclick="editProduct(${product.id})" class="btn btn-warning btn-sm">
                        ✏️ تعديل
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="btn btn-danger btn-sm">
                        🗑️ حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadAdminOffers() {
    const offers = getOffers();
    const products = getProducts();
    const offerImages = getOfferImages();
    const container = document.getElementById('adminOffersList');
    
    if (!container) return;
    
    if (offers.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد عروض</div>';
        return;
    }
    
    container.innerHTML = offers.map(offer => {
        const product = products.find(p => p.id === offer.productId);
        const endDate = new Date(offer.endDate);
        const now = new Date();
        const isExpired = endDate < now;
        const offerImage = offerImages[offer.id] || offer.imageUrl;
        
        return `
            <div class="admin-offer ${isExpired ? 'expired' : ''}">
                <div class="offer-icon">
                    ${offerImage ? 
                        `<img src="${offerImage}" alt="${offer.title}" style="width:100%;height:100%;object-fit:cover;">` : 
                        '🎁'
                    }
                </div>
                <div class="offer-details">
                    <h4>${offer.title}</h4>
                    <p>
                        <span class="offer-discount-badge">${offer.discount}%</span>
                        <span>${product ? product.name : 'منتج محذوف'}</span>
                        <span>| ينتهي: ${formatDate(offer.endDate)}</span>
                    </p>
                    ${offer.description ? `<p style="color: #666; margin-top: 0.5rem;">${offer.description}</p>` : ''}
                </div>
                <button onclick="deleteOffer(${offer.id})" class="btn btn-danger btn-sm">
                    🗑️ حذف
                </button>
            </div>
        `;
    }).join('');
}

function loadAdminOrders() {
    const orders = getOrders();
    const container = document.getElementById('adminOrdersList');
    
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-message">لا توجد طلبات</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <h4>الطلب #${order.orderNumber}</h4>
                <span class="status-badge">${order.status}</span>
            </div>
            <div class="order-details">
                <p><strong>العميل:</strong> ${order.customerName}</p>
                <p><strong>الهاتف:</strong> ${order.phone}</p>
                <p><strong>الإجمالي:</strong> ${order.total} ج.م</p>
                <p><strong>التاريخ:</strong> ${order.date}</p>
            </div>
        </div>
    `).join('');
}

function showMessage(text, type = 'success') {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'times-circle' : 
                        type === 'warning' ? 'exclamation-triangle' : 
                        type === 'info' ? 'info-circle' : 'check-circle'}"></i>
        <span>${text}</span>
    `;
    
    container.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'تاريخ غير معروف';
        
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'تاريخ غير معروف';
    }
}
// ==================== فلترة حسب القسم ====================
function filterByCategory(category) {
    // الانتقال إلى صفحة المنتجات
    showSection('products');
    
    // تعيين فلتر الفئة
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
    
    // إعادة تحميل المنتجات مع الفلتر
    setTimeout(() => {
        loadProducts();
    }, 100);
}

// ==================== إعداد الأحداث ====================
function setupEvents() {
    // البحث في المنتجات
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', loadProducts);
    }
    
    // الفلترة
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadProducts);
    }
    
    // البحث في العملاء
    const customerSearch = document.getElementById('customerSearch');
    if (customerSearch) {
        customerSearch.addEventListener('input', filterCustomers);
    }
    
    // الروابط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    // زر الدخول
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('login');
        });
    }
    
    // زر إنشاء حساب
    const registerLink = document.querySelector('a[href="#register"]');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('register');
        });
    }
    
    // زر العودة لتسجيل الدخول
    const backToLogin = document.querySelector('a[href="#login"]');
    if (backToLogin) {
        backToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('login');
        });
    }
    
    // إغلاق المودالات عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // الضغط على زر ESC لإغلاق المودالات
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// ==================== بدء التطبيق ====================
document.addEventListener('DOMContentLoaded', initApp);