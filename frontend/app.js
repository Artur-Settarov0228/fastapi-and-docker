// ===== Configuration =====
const API_BASE = '/api/v1/users';

// ===== Gradient Classes =====
const GRADIENT_CLASSES = [
    'user-card__avatar--gradient-1',
    'user-card__avatar--gradient-2',
    'user-card__avatar--gradient-3',
    'user-card__avatar--gradient-4',
    'user-card__avatar--gradient-5'
];

// ===== Tag mapping =====
function roleToTag(role) {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'admin';
    if (r.includes('moderator') || r.includes('mod')) return 'mod';
    return 'user';
}

// ===== State =====
let allUsers = [];
let currentFilter = '';
let deleteUserId = null;

// ===== DOM Elements =====
const usersGrid = document.getElementById('users-grid');
const statTotal = document.getElementById('stat-total');
const statLocations = document.getElementById('stat-locations');
const addModal = document.getElementById('add-modal');
const userModal = document.getElementById('user-modal');
const modalBody = document.getElementById('modal-body');
const deleteModal = document.getElementById('delete-modal');
const deleteConfirmText = document.getElementById('delete-confirm-text');
const toastEl = document.getElementById('toast');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    // Close modals on overlay click
    [addModal, userModal, deleteModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('modal-overlay--active');
                document.body.style.overflow = '';
            }
        });
    });

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAddModal();
            closeDetailModal();
            closeDeleteModal();
        }
    });
});

// ===== API Functions =====
async function loadUsers() {
    showLoading();

    try {
        const response = await fetch(API_BASE + '/');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // API now returns full user objects from database
        allUsers = data.map((user, index) => ({
            ...user,
            gradientClass: GRADIENT_CLASSES[user.id % GRADIENT_CLASSES.length],
            tag: roleToTag(user.role)
        }));

        renderUsers(allUsers);
        updateStats(allUsers);
        showToast('Ma\'lumotlar muvaffaqiyatli yuklandi!', 'success');
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Xatolik: API bilan ulanib bo\'lmadi', 'error');
        usersGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <div class="empty-state__text">
                    API bilan ulanishda xatolik yuz berdi.<br>
                    Iltimos, backend ishga tushirilganligini tekshiring.
                </div>
            </div>
        `;
    }
}

async function createUser(userData) {
    const response = await fetch(API_BASE + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || `HTTP ${response.status}`);
    }

    return await response.json();
}

async function deleteUserApi(userId) {
    const response = await fetch(`${API_BASE}/${userId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || `HTTP ${response.status}`);
    }

    return await response.json();
}

// ===== Rendering =====
function renderUsers(users) {
    if (users.length === 0 && currentFilter) {
        usersGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔍</div>
                <div class="empty-state__text">Hech qanday foydalanuvchi topilmadi</div>
            </div>
        `;
        return;
    }

    if (users.length === 0) {
        usersGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">👥</div>
                <div class="empty-state__text">
                    Hali foydalanuvchilar yo'q.<br>
                    <strong>"Foydalanuvchi qo'shish"</strong> tugmasini bosing!
                </div>
            </div>
        `;
        return;
    }

    usersGrid.innerHTML = users.map((user, i) => `
        <div class="user-card fade-in-up" 
             style="animation-delay: ${i * 0.08}s"
             onclick="openDetailModal(${user.id})"
             id="user-card-${user.id}">
            <div class="user-card__header">
                <div class="user-card__avatar ${user.gradientClass}">
                    ${user.full_name.charAt(0).toUpperCase()}
                </div>
                <div class="user-card__info">
                    <div class="user-card__name">${escapeHtml(user.full_name)}</div>
                    <div class="user-card__role">${escapeHtml(user.role)}</div>
                </div>
                <button class="user-card__delete" 
                        onclick="event.stopPropagation(); openDeleteModal(${user.id}, '${escapeHtml(user.full_name)}')" 
                        title="O'chirish">
                    🗑️
                </button>
            </div>
            <div class="user-card__body">
                <div class="user-card__detail">
                    <div class="user-card__detail-icon">📧</div>
                    <span>${escapeHtml(user.email)}</span>
                </div>
                <div class="user-card__detail">
                    <div class="user-card__detail-icon">📍</div>
                    <span>${escapeHtml(user.location)}</span>
                </div>
                ${user.phone ? `
                <div class="user-card__detail">
                    <div class="user-card__detail-icon">📱</div>
                    <span>${escapeHtml(user.phone)}</span>
                </div>` : ''}
                <div class="user-card__detail">
                    <div class="user-card__detail-icon">📅</div>
                    <span>Qo'shilgan: ${formatDate(user.created_at)}</span>
                </div>
            </div>
            <div class="user-card__footer">
                <div class="user-card__tags">
                    <span class="user-card__tag user-card__tag--${user.tag}">${user.tag}</span>
                </div>
                <button class="btn btn--ghost btn--sm" onclick="event.stopPropagation(); openDetailModal(${user.id})">
                    Batafsil →
                </button>
            </div>
        </div>
    `).join('');
}

function showLoading() {
    usersGrid.innerHTML = `
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-card"></div>
    `;
}

function updateStats(users) {
    animateCounter(statTotal, users.length);
    const uniqueLocations = new Set(users.map(u => u.location.split(',')[0].trim()));
    animateCounter(statLocations, uniqueLocations.size);
}

function animateCounter(element, target) {
    let current = 0;
    if (target === 0) {
        element.textContent = '0';
        return;
    }
    const step = Math.max(1, Math.ceil(target / 20));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        element.textContent = current;
    }, 30);
}

// ===== Search/Filter =====
function filterUsers(query) {
    currentFilter = query.toLowerCase().trim();

    if (!currentFilter) {
        renderUsers(allUsers);
        return;
    }

    const filtered = allUsers.filter(user =>
        user.full_name.toLowerCase().includes(currentFilter) ||
        user.email.toLowerCase().includes(currentFilter) ||
        user.role.toLowerCase().includes(currentFilter) ||
        user.location.toLowerCase().includes(currentFilter) ||
        (user.phone && user.phone.includes(currentFilter))
    );

    renderUsers(filtered);
}

// ===== Add User Modal =====
function openAddModal() {
    document.getElementById('add-user-form').reset();
    addModal.classList.add('modal-overlay--active');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => document.getElementById('input-name').focus(), 300);
}

function closeAddModal() {
    addModal.classList.remove('modal-overlay--active');
    document.body.style.overflow = '';
}

async function handleAddUser(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');

    // Show loading
    submitBtn.disabled = true;
    submitText.textContent = 'Saqlanmoqda...';
    submitSpinner.style.display = 'inline-block';

    const userData = {
        full_name: document.getElementById('input-name').value.trim(),
        email: document.getElementById('input-email').value.trim(),
        phone: document.getElementById('input-phone').value.trim() || null,
        location: document.getElementById('input-location').value.trim(),
        role: document.getElementById('input-role').value
    };

    try {
        await createUser(userData);
        showToast(`"${userData.full_name}" muvaffaqiyatli qo'shildi!`, 'success');
        closeAddModal();
        await loadUsers();
    } catch (error) {
        console.error('Error creating user:', error);
        showToast(`Xatolik: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.textContent = 'Saqlash';
        submitSpinner.style.display = 'none';
    }
}

// ===== Detail Modal =====
function openDetailModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    modalBody.innerHTML = `
        <div class="modal__profile">
            <div class="modal__avatar ${user.gradientClass}">
                ${user.full_name.charAt(0).toUpperCase()}
            </div>
            <div class="modal__name">${escapeHtml(user.full_name)}</div>
            <div class="modal__role">${escapeHtml(user.role)}</div>
        </div>
        <div class="modal__details">
            <div class="modal__detail-item">
                <div class="modal__detail-icon">🆔</div>
                <div class="modal__detail-content">
                    <div class="modal__detail-label">ID</div>
                    <div class="modal__detail-value">${user.id}</div>
                </div>
            </div>
            <div class="modal__detail-item">
                <div class="modal__detail-icon">📧</div>
                <div class="modal__detail-content">
                    <div class="modal__detail-label">Email</div>
                    <div class="modal__detail-value">${escapeHtml(user.email)}</div>
                </div>
            </div>
            ${user.phone ? `
            <div class="modal__detail-item">
                <div class="modal__detail-icon">📱</div>
                <div class="modal__detail-content">
                    <div class="modal__detail-label">Telefon</div>
                    <div class="modal__detail-value">${escapeHtml(user.phone)}</div>
                </div>
            </div>` : ''}
            <div class="modal__detail-item">
                <div class="modal__detail-icon">📍</div>
                <div class="modal__detail-content">
                    <div class="modal__detail-label">Manzil</div>
                    <div class="modal__detail-value">${escapeHtml(user.location)}</div>
                </div>
            </div>
            <div class="modal__detail-item">
                <div class="modal__detail-icon">📅</div>
                <div class="modal__detail-content">
                    <div class="modal__detail-label">Qo'shilgan sana</div>
                    <div class="modal__detail-value">${formatDate(user.created_at)}</div>
                </div>
            </div>
        </div>
        <div class="modal__actions">
            <button class="btn btn--danger btn--sm" onclick="closeDetailModal(); openDeleteModal(${user.id}, '${escapeHtml(user.full_name)}')">
                🗑️ O'chirish
            </button>
        </div>
    `;

    userModal.classList.add('modal-overlay--active');
    document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
    userModal.classList.remove('modal-overlay--active');
    document.body.style.overflow = '';
}

// ===== Delete Modal =====
function openDeleteModal(userId, userName) {
    deleteUserId = userId;
    deleteConfirmText.innerHTML = `<strong>"${userName}"</strong> foydalanuvchisini rostdan ham o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`;
    deleteModal.classList.add('modal-overlay--active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    deleteModal.classList.remove('modal-overlay--active');
    document.body.style.overflow = '';
    deleteUserId = null;
}

async function confirmDelete() {
    if (!deleteUserId) return;

    const btn = document.getElementById('confirm-delete-btn');
    btn.disabled = true;
    btn.textContent = 'O\'chirilmoqda...';

    try {
        await deleteUserApi(deleteUserId);
        showToast('Foydalanuvchi muvaffaqiyatli o\'chirildi!', 'success');
        closeDeleteModal();
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast(`Xatolik: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Ha, o\'chirish';
    }
}

// ===== Toast =====
function showToast(message, type = 'success') {
    toastEl.textContent = `${type === 'success' ? '✅' : '❌'} ${message}`;
    toastEl.className = `toast toast--${type} toast--visible`;

    setTimeout(() => {
        toastEl.classList.remove('toast--visible');
    }, 3000);
}

// ===== Utilities =====
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const months = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
