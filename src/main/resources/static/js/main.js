'use strict';
const API_BASE = window.location.origin;

// DOM refs
const usernamePage     = document.querySelector('#username-page');
const chatPage         = document.querySelector('#chat-page');
const usernameForm     = document.querySelector('#usernameForm');
const messageForm      = document.querySelector('#messageForm');
const messageInput     = document.querySelector('#message');
const chatArea         = document.querySelector('#chat-messages');
const logout           = document.querySelector('#logout');
const groupList        = document.querySelector('#groupsList');
const emptyState       = document.querySelector('#empty-state');
const chatHeader       = document.querySelector('#chat-header');
const chatHeaderName   = document.querySelector('#chat-header-name');
const chatHeaderAvatar = document.querySelector('#chat-header-avatar');
const groupModal       = document.querySelector('#groupModal');

let stompClient       = null;
let nickname          = null;
let fullname          = null;
let selectedUserId    = null;
let selectedGroupId   = null;
let groupSubscription = null;

// Tracks unread counts so the 3-second poll doesn't wipe them
const unreadCounts = {};   // { [nickname|groupId]: number }

// ── Helpers ───────────────────────────────────────────────────
function initials(name) {
    return name ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';
}

function setHeader(name, isGroup = false) {
    chatHeaderAvatar.textContent = initials(name);
    chatHeaderAvatar.style.background = isGroup
        ? 'linear-gradient(135deg, #00d4aa, #6c63ff)'
        : 'linear-gradient(135deg, #6c63ff, #9c95ff)';
    chatHeaderName.textContent = name;
    emptyState.classList.add('hidden');
    chatHeader.classList.remove('hidden');
    messageForm.classList.remove('hidden');
}

function setBadge(id, count) {
    unreadCounts[id] = count;
    const el = document.getElementById(id);
    if (!el) return;
    const badge = el.querySelector('.nbr-msg');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
    }
}

function incrementBadge(id) {
    const current = unreadCounts[id] || 0;
    setBadge(id, current + 1);
}

// ── Connect ───────────────────────────────────────────────────
function connect(event) {
    event.preventDefault();
    nickname = document.querySelector('#nickname').value.trim();
    fullname = document.querySelector('#fullname').value.trim();
    if (!nickname || !fullname) return;

    usernamePage.classList.add('hidden');
    chatPage.classList.remove('hidden');

    document.querySelector('#connected-user-fullname').textContent = fullname;
    document.querySelector('#me-avatar-letter').textContent = initials(fullname);

    const socket = new SockJS(`${API_BASE}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({ nickname }, onConnected, onError);
}

function onConnected() {
    findAndDisplayConnectedUsers();
    setInterval(findAndDisplayConnectedUsers, 3000);

    // Subscribe to /user/queue/messages — Spring's convertAndSendToUser()
    // automatically routes to the correct user session. No nickname needed in the path.
    stompClient.subscribe('/user/queue/messages', onPrivateMessageReceived);

    // BUG FIX 2: /topic/public carries User join/leave events, NOT chat messages.
    // Handle them separately — only refresh the user list, don't treat as a chat message.
    stompClient.subscribe('/topic/public', onUserPresenceEvent);

    stompClient.subscribe('/topic/groups', onGroupCreated);

    stompClient.send('/app/user.addUser', {}, JSON.stringify({
        nickname, fullname, status: 'ONLINE'
    }));

    loadGroups();
}

function onError() {
    console.error('WebSocket connection failed. Please refresh.');
}

// ── Presence events (join / leave) ────────────────────────────
// BUG FIX 2 (continued): This receives User objects, not ChatMessages.
// We just refresh the connected-users list.
function onUserPresenceEvent(payload) {
    findAndDisplayConnectedUsers();
}

// ── Users ─────────────────────────────────────────────────────
async function findAndDisplayConnectedUsers() {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) return;
    const text = await res.text();
    let users = text ? JSON.parse(text) : [];
    users = users.filter(u => u.nickname !== nickname);

    const list = document.getElementById('connectedUsers');

    // BUG FIX 3: Don't wipe the list wholesale — only add new users and remove
    // gone ones, so existing unread badges are preserved.
    const existingIds = new Set([...list.querySelectorAll('.user-item')].map(el => el.id));
    const incomingIds = new Set(users.map(u => u.nickname));

    // Remove users who left
    existingIds.forEach(id => {
        if (!incomingIds.has(id)) {
            const el = document.getElementById(id);
            if (el) el.remove();
            delete unreadCounts[id];
        }
    });

    // Add users who are new
    users.forEach(user => {
        if (!existingIds.has(user.nickname)) {
            appendUserElement(user, list);
        }
    });
}

function appendUserElement(user, list) {
    const li = document.createElement('li');
    li.classList.add('user-item');
    li.id = user.nickname;

    const img = document.createElement('img');
    img.src = '/image/user_icon.png';
    img.alt = user.fullname;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = user.fullname;

    const badge = document.createElement('span');
    badge.classList.add('nbr-msg', 'hidden');
    badge.textContent = '0';

    li.appendChild(img);
    li.appendChild(nameSpan);
    li.appendChild(badge);
    li.addEventListener('click', userItemClick);
    list.appendChild(li);
}

function userItemClick(e) {
    document.querySelectorAll('.user-item, .group-item').forEach(i => i.classList.remove('active'));
    const item = e.currentTarget;
    item.classList.add('active');
    selectedUserId = item.id;
    selectedGroupId = null;

    // Clear badge
    setBadge(selectedUserId, 0);

    const nameEl = item.querySelector('span:not(.nbr-msg)');
    setHeader(nameEl ? nameEl.textContent : selectedUserId);
    fetchAndDisplayUserChat();
}

// ── Groups ────────────────────────────────────────────────────
async function loadGroups() {
    if (!nickname) return;
    const res = await fetch(`${API_BASE}/groups/${nickname}`);
    const groups = await res.json();
    groupList.innerHTML = '';
    if (Array.isArray(groups)) groups.forEach(appendGroupElement);
}

function appendGroupElement(group) {
    if (document.getElementById(group.id)) return;
    const li = document.createElement('li');
    li.classList.add('group-item');
    li.id = group.id;

    const icon = document.createElement('div');
    icon.classList.add('group-item-icon');
    icon.textContent = initials(group.name);

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('group-item-name');
    nameSpan.textContent = group.name;

    const badge = document.createElement('span');
    badge.classList.add('nbr-msg', 'hidden');
    badge.textContent = '0';

    li.appendChild(icon);
    li.appendChild(nameSpan);
    li.appendChild(badge);
    li.addEventListener('click', groupItemClick);
    groupList.appendChild(li);
}

function onGroupCreated(payload) {
    const group = JSON.parse(payload.body);
    if (group.members.includes(nickname)) appendGroupElement(group);
}

function groupItemClick(e) {
    document.querySelectorAll('.user-item, .group-item').forEach(i => i.classList.remove('active'));
    const item = e.currentTarget;
    item.classList.add('active');
    selectedGroupId = item.id;
    selectedUserId = null;

    setBadge(selectedGroupId, 0);

    const nameEl = item.querySelector('.group-item-name');
    setHeader(nameEl ? nameEl.textContent : selectedGroupId, true);

    if (groupSubscription) { groupSubscription.unsubscribe(); groupSubscription = null; }
    groupSubscription = stompClient.subscribe(
        `/topic/group/${selectedGroupId}`,
        onGroupMessageReceived
    );

    fetchGroupChat(selectedGroupId);
}

// ── Group modal ───────────────────────────────────────────────
document.getElementById('createGroupBtn').addEventListener('click', () => {
    groupModal.classList.remove('hidden');
    document.getElementById('groupNameInput').value = '';
    document.getElementById('groupMembersInput').value = '';
    document.getElementById('groupNameInput').focus();
});
document.getElementById('modalClose').addEventListener('click', () => groupModal.classList.add('hidden'));
document.getElementById('modalCancel').addEventListener('click', () => groupModal.classList.add('hidden'));
document.getElementById('modalCreate').addEventListener('click', async () => {
    const groupName = document.getElementById('groupNameInput').value.trim();
    const membersRaw = document.getElementById('groupMembersInput').value;
    if (!groupName) return;
    const members = membersRaw.split(',').map(m => m.trim()).filter(Boolean);
    members.push(nickname);
    const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, members })
    });
    const created = await res.json();
    appendGroupElement(created);
    groupModal.classList.add('hidden');
});
groupModal.addEventListener('click', e => { if (e.target === groupModal) groupModal.classList.add('hidden'); });

// ── Messages ─────────────────────────────────────────────────
function displayMessage(senderId, content, timestamp = new Date()) {
    const wrap = document.createElement('div');
    wrap.classList.add('message', senderId === nickname ? 'sender' : 'receiver');

    if (senderId !== nickname) {
        const name = document.createElement('div');
        name.classList.add('sender-name');
        name.textContent = senderId;
        wrap.appendChild(name);
    }

    if (content.match(/\.(jpeg|jpg|gif|png)(\?.*)?$/i)) {
        const img = document.createElement('img');
        img.src = content;
        wrap.appendChild(img);
    } else if (content.match(/\.(pdf|doc|docx|zip|txt|ppt|pptx|xlsx|csv)$/i)) {
        const a = document.createElement('a');
        a.href = content; a.target = '_blank';
        a.textContent = '📎 ' + content.split('/').pop();
        wrap.appendChild(a);
    } else {
        const p = document.createElement('p');
        p.textContent = content;
        wrap.appendChild(p);
    }

    const time = document.createElement('span');
    time.classList.add('timestamp');
    time.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    wrap.appendChild(time);

    chatArea.appendChild(wrap);
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function fetchAndDisplayUserChat() {
    const res = await fetch(`${API_BASE}/messages/${nickname}/${selectedUserId}`);
    const msgs = await res.json();
    chatArea.innerHTML = '';
    msgs.forEach(m => displayMessage(m.senderId, m.content, m.timestamp));
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function fetchGroupChat(groupId) {
    const res = await fetch(`${API_BASE}/group/messages/${groupId}`);
    const msgs = await res.json();
    chatArea.innerHTML = '';
    msgs.forEach(m => displayMessage(m.senderId, m.content, m.timestamp));
    chatArea.scrollTop = chatArea.scrollHeight;
}

// BUG FIX 1 (continued): Renamed from onMessageReceived to make the purpose clear.
// Handles ChatNotification objects sent to /user/{nickname}/queue/messages.
function onPrivateMessageReceived(payload) {
    const msg = JSON.parse(payload.body);
    // msg has: id, senderId, recipientId, content, timestamp (ChatNotification shape)
    const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
    if (selectedUserId === msg.senderId) {
        // Conversation with this person is open — display immediately
        displayMessage(msg.senderId, msg.content, timestamp);
    } else {
        // Different conversation — increment the sidebar badge
        incrementBadge(msg.senderId);
    }
}

function onGroupMessageReceived(payload) {
    const msg = JSON.parse(payload.body);
    // msg has: groupId, senderId, content, timestamp
    if (msg.groupId === selectedGroupId) {
        displayMessage(msg.senderId, msg.content, msg.timestamp);
    } else {
        incrementBadge(msg.groupId);
    }
}

function sendMessage(event) {
    event.preventDefault();
    const content = messageInput.value.trim();
    if (!content || !stompClient) return;

    if (selectedGroupId) {
        stompClient.send('/app/group.chat', {}, JSON.stringify({
            groupId: selectedGroupId,
            senderId: nickname,
            content,
            timestamp: new Date()
        }));
    } else if (selectedUserId) {
        stompClient.send('/app/chat', {}, JSON.stringify({
            senderId: nickname,
            recipientId: selectedUserId,
            content,
            timestamp: new Date()
        }));
        // Only the sender displays the message immediately (recipient gets it via WebSocket)
        displayMessage(nickname, content, new Date());
    }
    messageInput.value = '';
}

async function sendFile() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) return;

    if (!selectedUserId && !selectedGroupId) {
        alert('Please select a chat first before sending a file.');
        fileInput.value = '';
        return;
    }

    // Show uploading indicator
    const originalPlaceholder = messageInput.placeholder;
    messageInput.placeholder = 'Uploading file...';
    messageInput.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });

        if (!res.ok) throw new Error('Upload failed');

        const fileUrl = await res.text();
        fileInput.value = '';

        // Auto-send the file as a message immediately
        if (selectedGroupId) {
            stompClient.send('/app/group.chat', {}, JSON.stringify({
                groupId: selectedGroupId,
                senderId: nickname,
                content: fileUrl,
                timestamp: new Date()
            }));
        } else {
            stompClient.send('/app/chat', {}, JSON.stringify({
                senderId: nickname,
                recipientId: selectedUserId,
                content: fileUrl,
                timestamp: new Date()
            }));
            displayMessage(nickname, fileUrl, new Date());
        }
    } catch (e) {
        alert('File upload failed. Please try again.');
    } finally {
        messageInput.placeholder = originalPlaceholder;
        messageInput.disabled = false;
    }
}
document.getElementById('fileInput').addEventListener('change', sendFile);

function onLogout() {
    if (stompClient) {
        stompClient.send('/app/user.disconnectUser', {}, JSON.stringify({
            nickname, fullname, status: 'OFFLINE'
        }));
    }
    window.location.reload();
}

// ── Event bindings ────────────────────────────────────────────
usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
logout.addEventListener('click', onLogout, true);
window.onbeforeunload = () => onLogout();