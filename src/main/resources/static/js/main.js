'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const connectingElement = document.querySelector('.connecting');
const chatArea = document.querySelector('#chat-messages');
const logout = document.querySelector('#logout');

let stompClient = null;
let nickname = null;
let fullname = null;
let selectedUserId = null;
let selectedGroupId = null;
let groupSubscription = null;
const groupList = document.querySelector('#groupsList');

function connect(event) {
    nickname = document.querySelector('#nickname').value.trim();
    fullname = document.querySelector('#fullname').value.trim();

    if (nickname && fullname) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect(
            { nickname: nickname },
            onConnected,
            onError
        );
    }
    event.preventDefault();
}


function onConnected() {

    stompClient.subscribe(`/user/queue/messages`, onMessageReceived);
    stompClient.subscribe(`/topic/public`, onMessageReceived);
    stompClient.subscribe(`/topic/groups`, onGroupCreated);

    stompClient.send("/app/user.addUser", {}, JSON.stringify({
        nickname: nickname,
        fullname: fullname,
        status: 'ONLINE'
    }));

    document.querySelector('#connected-user-fullname').textContent = fullname;

    findAndDisplayConnectedUsers();   // ✔ only here
    loadGroups();
}

function onGroupCreated(payload){

    const group = JSON.parse(payload.body);

    console.log("Group broadcast received:", group);

    if(group.members.includes(nickname)){
        appendGroupElement(group);
    }
}

function onGroupMessageReceived(payload) {

    const message = JSON.parse(payload.body);

    if(message.groupId === selectedGroupId){

        displayMessage(message.senderId, message.content,message.timestamp);
        chatArea.scrollTop = chatArea.scrollHeight;

    }else{

        const groupElement = document.getElementById(message.groupId);

        if(groupElement){
            const nbrMsg = groupElement.querySelector('.nbr-msg');

            if(!nbrMsg) return;
            let count = parseInt(nbrMsg.textContent);

            if(isNaN(count)){
                count = 0;
            }

            nbrMsg.textContent = count + 1;
            nbrMsg.classList.remove('hidden');
        }

    }
}

async function fetchGroupChat(groupId) {

    const response = await fetch(`/group/messages/${groupId}`);

    const messages = await response.json();

    chatArea.innerHTML = "";

    messages.forEach(msg => {
        displayMessage(msg.senderId, msg.content,msg.timestamp);
    });
}

function appendGroupElement(group) {

    if(document.getElementById(group.id)) return;

    const listItem = document.createElement('li');

    listItem.classList.add('group-item');

    listItem.id = group.id;

    listItem.textContent = group.name;

    listItem.addEventListener('click', groupItemClick);

    const receivedMsgs = document.createElement('span');
    receivedMsgs.classList.add('nbr-msg', 'hidden');
    receivedMsgs.textContent = '0';

    listItem.appendChild(receivedMsgs);

    groupList.appendChild(listItem);
}

async function createGroup(){

    const groupName = prompt("Enter group name");

    const members = prompt("Enter members (comma separated)")
        .split(",")
        .map(m => m.trim());

    members.push(nickname);

    const group = {
        name: groupName,
        members: members
    };

    const response = await fetch(`/groups`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(group)
    });

    const createdGroup = await response.json();

    // show immediately for creator
    appendGroupElement(createdGroup);
}

document
    .getElementById("createGroupBtn")
    .addEventListener("click", createGroup);

async function findAndDisplayConnectedUsers() {
    const connectedUsersResponse = await fetch('/users');
    let connectedUsers = [];

    if (connectedUsersResponse.ok) {
        const text = await connectedUsersResponse.text();
        connectedUsers = text ? JSON.parse(text) : [];
    }
    connectedUsers = connectedUsers.filter(user => user.nickname !== nickname);
    const connectedUsersList = document.getElementById('connectedUsers');
    connectedUsersList.innerHTML = '';

    connectedUsers.forEach(user => {
        appendUserElement(user, connectedUsersList);
        if (connectedUsers.indexOf(user) < connectedUsers.length - 1) {
            const separator = document.createElement('li');
            separator.classList.add('separator');
            connectedUsersList.appendChild(separator);
        }
    });
}

function appendUserElement(user, connectedUsersList) {
    const listItem = document.createElement('li');
    listItem.classList.add('user-item');
    listItem.id = user.nickname;

    const userImage = document.createElement('img');
    userImage.src = '/image/user_icon.png';
    userImage.alt = user.fullname;

    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = user.fullname;

    const receivedMsgs = document.createElement('span');
    receivedMsgs.textContent = '0';
    receivedMsgs.classList.add('nbr-msg', 'hidden');

    listItem.appendChild(userImage);
    listItem.appendChild(usernameSpan);
    listItem.appendChild(receivedMsgs);

    listItem.addEventListener('click', userItemClick);

    connectedUsersList.appendChild(listItem);
}

function userItemClick(event) {

    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });

    const clickedUser = event.currentTarget;
    clickedUser.classList.add('active');

    selectedUserId = clickedUser.getAttribute('id');
    selectedGroupId = null;

    messageForm.classList.remove('hidden'); // show input

    const nbrMsg = clickedUser.querySelector('.nbr-msg');
    if(nbrMsg){
        nbrMsg.classList.add('hidden');
        nbrMsg.textContent = '0';
    }

    fetchAndDisplayUserChat();
}

function displayMessage(senderId, content, timestamp = new Date()) {

    const container = document.createElement('div');
    container.classList.add('message');

    if(senderId === nickname){
        container.classList.add('sender');
    }else{
        container.classList.add('receiver');
    }
    container.style.wordBreak = "break-word";
    // Sender name
    if(senderId !== nickname){
        const sender = document.createElement('div');
        sender.classList.add('sender-name');
        sender.textContent = senderId;
        container.appendChild(sender);
    }

    // Message content
    if(content.match(/\.(jpeg|jpg|gif|png)(\?.*)?$/i)){

        const img = document.createElement("img");
        img.src = content;
        img.style.maxWidth = "200px";

        container.appendChild(img);

    }else if(content.match(/\.(pdf|doc|docx|zip|txt|ppt|pptx|xlsx|csv)$/i)){

        const link = document.createElement("a");
        link.href = content;
        link.target = "_blank";
        link.textContent = content.split("/").pop();

        container.appendChild(link);

    }else{

        const text = document.createElement("p");
        text.textContent = content;

        container.appendChild(text);
    }

    // Timestamp
    const time = document.createElement('span');
    time.classList.add('timestamp');
    time.textContent = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    container.appendChild(time);

    chatArea.appendChild(container);
}

async function fetchAndDisplayUserChat() {
    const userChatResponse = await fetch(`/messages/${nickname}/${selectedUserId}`);
    const userChat = await userChatResponse.json();
    chatArea.innerHTML = '';
    userChat.forEach(chat => {
        displayMessage(chat.senderId, chat.content,chat.timestamp);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
}


function onError() {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {

    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {

        if(selectedGroupId){

            const groupMessage = {
                groupId: selectedGroupId,
                senderId: nickname,
                content: messageContent,
                timestamp: new Date()
            };

            stompClient.send("/app/group.chat", {}, JSON.stringify(groupMessage));

        }else{

            const chatMessage = {
                senderId: nickname,
                recipientId: selectedUserId,
                content: messageContent,
                timestamp: new Date()
            };

            stompClient.send("/app/chat", {}, JSON.stringify(chatMessage));

            // only display immediately for private chat
            displayMessage(nickname, messageContent, new Date());
        }

        messageInput.value = '';
    }

    event.preventDefault();
}

async function loadGroups(){

    if(!nickname){
        console.log("Nickname not set yet");
        return;
    }

    const response = await fetch(`/groups/${nickname}`);

    const groups = await response.json();

    groupList.innerHTML = "";

    if(Array.isArray(groups)){
        groups.forEach(group => {
            appendGroupElement(group);
        });
    }
}

async function onMessageReceived(payload) {

    const message = JSON.parse(payload.body);

    // show message only if this chat is open
    if (selectedUserId === message.senderId) {

        displayMessage(message.senderId, message.content,message.timestamp);
        chatArea.scrollTop = chatArea.scrollHeight;

    } else {

        const notifiedUser = document.querySelector(`#${message.senderId}`);

        if (notifiedUser) {

            const nbrMsg = notifiedUser.querySelector('.nbr-msg');
            if(!nbrMsg) return;
            let count = parseInt(nbrMsg.textContent);

            if(isNaN(count)){
                count = 0;
            }

            nbrMsg.textContent = count + 1;
            nbrMsg.classList.remove('hidden');
        }
    }
}

function onLogout() {
    stompClient.send("/app/user.disconnectUser",
        {},
        JSON.stringify({nickname: nickname, fullname: fullname, status: 'OFFLINE'})
    );
    window.location.reload();
}

function groupItemClick(event) {

    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('active');
    });

    const clickedGroup = event.currentTarget;
    clickedGroup.classList.add('active');

    selectedGroupId = clickedGroup.getAttribute("id");
    selectedUserId = null;

    // 🔥 show typing box
    messageForm.classList.remove('hidden');

    if(groupSubscription){
        groupSubscription.unsubscribe();
        groupSubscription = null;
    }

    groupSubscription = stompClient.subscribe(
        `/topic/group/${selectedGroupId}`,
        onGroupMessageReceived
    );
    const nbrMsg = clickedGroup.querySelector('.nbr-msg');
    if(nbrMsg){
        nbrMsg.classList.add('hidden');
        nbrMsg.textContent = '0';
    }

    fetchGroupChat(selectedGroupId);
}

async function sendFile(){

    const fileInput = document.getElementById("fileInput");

    if(!fileInput.files.length){
        return;   // do nothing if no file selected
    }

    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/upload", {
        method:"POST",
        body: formData
    });

    const fileUrl = await response.text();

    messageInput.value = fileUrl;
    fileInput.value = "";
}

usernameForm.addEventListener('submit', connect, true); // step 1
messageForm.addEventListener('submit', sendMessage, true);
logout.addEventListener('click', onLogout, true);
window.onbeforeunload = () => onLogout();