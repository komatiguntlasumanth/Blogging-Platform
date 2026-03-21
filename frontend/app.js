const API_URL = 'https://blogging-platform-6byh.onrender.com/api';
let currentUser = null;
let currentToken = localStorage.getItem('token') || null;

try {
    const savedUser = localStorage.getItem('user');
    if (savedUser && savedUser !== 'undefined') {
        currentUser = JSON.parse(savedUser);
    }
} catch (err) {
    console.error('Failed to parse user from storage:', err);
    localStorage.removeItem('user'); // Clear corrupted data
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Selected inside the listener to ensure they exist
    const navLinks = document.getElementById('nav-links');
    const authFormEl = document.getElementById('auth-form-el');
    const authTitle = document.getElementById('auth-title');
    const authToggle = document.getElementById('auth-toggle');
    const authMessage = document.getElementById('auth-message');
    const postForm = document.getElementById('post-form');
    const postModal = document.getElementById('post-modal');

    const views = {
        feed: document.getElementById('feed-view'),
        auth: document.getElementById('auth-view'),
        dashboard: document.getElementById('dashboard-view')
    };

    // Initialize
    function init() {
        try {
            console.log('Rendering navigation...');
            renderNav();
            if (currentUser) {
                console.log('User found, showing feed');
                showView('feed');
            } else {
                console.log('No user, showing auth');
                showView('auth');
                if (window.toggleAuth) window.toggleAuth(false);
            }
            closePostModal();
        } catch (err) {
            console.error('Init error:', err);
            if (authMessage) authMessage.innerText = 'Initialization Error: ' + err.message;
        }
    }

    function renderNav() {
        if (!navLinks) return;
        navLinks.innerHTML = '';
        if (currentUser) {
            navLinks.innerHTML = `
                <span>Welcome, <strong>${currentUser.name}</strong></span>
                <button class="btn-outline" onclick="window.showView('dashboard')">Dashboard</button>
                <button class="btn-primary" onclick="window.logout()">Logout</button>
            `;
        } else {
            navLinks.innerHTML = `
                <button class="btn-outline" onclick="window.showView('auth')">Login</button>
                <button class="btn-primary" onclick="window.showView('auth'); window.toggleAuth(true)">Signup</button>
            `;
        }
    }

    window.showView = (viewName) => {
        Object.keys(views).forEach(key => {
            if (views[key]) views[key].classList.add('hidden');
        });
        if (views[viewName]) views[viewName].classList.remove('hidden');

        if (viewName === 'feed') fetchPosts();
        if (viewName === 'dashboard') fetchMyPosts();
    };

    // Auth Logic
    let isSignup = false;
    if (authToggle) authToggle.onclick = () => window.toggleAuth(!isSignup);

    window.toggleAuth = (signup) => {
        isSignup = signup;
        if (authTitle) authTitle.innerText = isSignup ? 'Create Account' : 'Login';
        const nameGroup = document.getElementById('name-group');
        if (nameGroup) nameGroup.classList.toggle('hidden', !isSignup);
        const toggleText = document.getElementById('auth-toggle-text');
        if (toggleText) toggleText.innerText = isSignup ? 'Already have an account?' : "Don't have an account?";
        if (authToggle) authToggle.innerText = isSignup ? 'Login' : 'Sign up';
        if (authMessage) authMessage.innerText = '';
    };

    if (authFormEl) authFormEl.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('auth-name').value;
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        const endpoint = isSignup ? '/auth/signup' : '/auth/login';
        const body = isSignup ? { name, email, password } : { email, password };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            currentToken = data.token;

            if (isSignup) alert('Welcome! Your account has been created.');

            renderNav();
            window.showView('dashboard');
        } catch (err) {
            if (authMessage) authMessage.innerText = err.message;
        }
    };

    window.logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        currentToken = null;
        renderNav();
        window.showView('feed');
    }

    // Post Logic
    async function fetchPosts() {
        try {
            const res = await fetch(`${API_URL}/posts`);
            const posts = await res.json();
            const container = document.getElementById('posts-container');
            if (!container) return;
            container.innerHTML = posts.length ? '' : '<p>No posts yet.</p>';
            posts.forEach(post => {
                const postEl = document.createElement('div');
                postEl.className = 'card post-card';
                postEl.innerHTML = `
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-meta">By ${post.author ? post.author.name : 'Unknown'} on ${new Date(post.date).toLocaleDateString()}</p>
                    <p class="post-content">${post.content}</p>
                `;
                container.appendChild(postEl);
            });
        } catch (err) {
            console.error('Fetch posts error:', err);
        }
    }

    async function fetchMyPosts() {
        try {
            if (!currentUser) return;
            const res = await fetch(`${API_URL}/posts`);
            const allPosts = await res.json();
            const myPosts = allPosts.filter(p => {
                const authorId = (p.author && p.author._id) ? p.author._id : p.author;
                return authorId === currentUser.id;
            });
            const container = document.getElementById('my-posts-container');
            if (!container) return;
            container.innerHTML = myPosts.length ? '' : '<p>You haven\'t posted anything yet.</p>';
            myPosts.forEach(post => {
                const postEl = document.createElement('div');
                postEl.className = 'card';
                postEl.innerHTML = `
                    <h2 class="post-title">${post.title}</h2>
                    <p class="post-meta">${new Date(post.date).toLocaleDateString()}</p>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-outline" onclick="window.openPostModal('${post._id}')">Edit</button>
                        <button class="btn-outline" style="color: red; border-color: red;" onclick="window.deletePost('${post._id}')">Delete</button>
                    </div>
                `;
                container.appendChild(postEl);
            });
        } catch (err) {
            console.error('Fetch my posts error:', err);
        }
    }

    window.openPostModal = (id = null) => {
        if (!postModal) return;
        postModal.classList.remove('hidden');
        if (id) {
            document.getElementById('modal-title').innerText = 'Edit Post';
            document.getElementById('post-id').value = id;
            fetch(`${API_URL}/posts/${id}`)
                .then(res => res.json())
                .then(post => {
                    document.getElementById('post-title').value = post.title;
                    document.getElementById('post-content').value = post.content;
                });
        } else {
            document.getElementById('modal-title').innerText = 'Create New Post';
            document.getElementById('post-id').value = '';
            if (postForm) postForm.reset();
        }
    }

    window.closePostModal = () => {
        if (postModal) postModal.classList.add('hidden');
    }

    if (postForm) postForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('post-id').value;
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/posts/${id}` : `${API_URL}/posts`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ title, content })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to save post');
            }

            window.closePostModal();
            fetchMyPosts();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    window.deletePost = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`${API_URL}/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (!res.ok) throw new Error('Failed to delete');
            fetchMyPosts();
        } catch (err) {
            alert(err.message);
        }
    }

    window.onerror = function (msg, url, line, col, error) {
        console.error('Global Error:', msg, 'at', url, ':', line);
        if (authMessage) authMessage.innerText = 'JS Error: ' + msg;
    };

    console.log('App initializing...');
    init();
});
