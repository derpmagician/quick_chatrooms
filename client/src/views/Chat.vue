<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

const newRoomName = ref('')
const showNewRoomModal = ref(false)
const messagesContainer = ref<HTMLDivElement | null>(null)
const newMessage = ref('')

const onlineUserIds = computed(() => new Set(chatStore.onlineUsers.map(u => u.userId)))

const onlineMembers = computed(() => chatStore.roomMembers)

onMounted(async () => {
  chatStore.setupSocketListeners()
  await chatStore.fetchRooms()
})

onUnmounted(() => {
  chatStore.cleanupSocketListeners()
  chatStore.leaveCurrentRoom()
})

watch(() => chatStore.messages.length, async () => {
  await nextTick()
  scrollToBottom()
})

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function selectRoom(roomId: string) {
  chatStore.leaveCurrentRoom()
  await chatStore.joinRoom(roomId)
}

function handleSendMessage() {
  if (!newMessage.value.trim()) return
  chatStore.sendMessage(newMessage.value)
  newMessage.value = ''
}

function handleTyping() {
  chatStore.handleTyping()
}

async function createRoom() {
  if (!newRoomName.value.trim()) return
  
  const room = await chatStore.createRoom(newRoomName.value.trim())
  
  if (room) {
    showNewRoomModal.value = false
    newRoomName.value = ''
    await selectRoom(room.id)
  }
}

function logout() {
  chatStore.leaveCurrentRoom()
  authStore.logout()
  router.push('/login')
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Chat</h2>
        <button class="logout-btn" @click="logout">Salir</button>
      </div>
      
      <div class="user-info">
        <div class="avatar">{{ authStore.user?.username?.charAt(0).toUpperCase() }}</div>
        <span>{{ authStore.user?.username }}</span>
      </div>
      
      <div class="rooms-header">
        <h3>Salas</h3>
        <button class="add-room-btn" @click="showNewRoomModal = true">+</button>
      </div>
      
      <ul class="rooms-list">
        <li
          v-for="room in chatStore.rooms"
          :key="room.id"
          :class="{ active: chatStore.currentRoom?.id === room.id }"
          @click="selectRoom(room.id)"
        >
          <span class="room-name">{{ room.name }}</span>
          <span v-if="room.isPrivate" class="private-badge">Privado</span>
          <span v-if="room._count" class="members-count">{{ room._count.members }}</span>
        </li>
      </ul>
    </aside>
    
    <main class="chat-main">
      <template v-if="chatStore.currentRoom">
        <header class="chat-header">
          <h2>{{ chatStore.currentRoom.name }}</h2>
        </header>
        
        <div class="chat-content">
          <div class="messages-wrapper">
            <div ref="messagesContainer" class="messages-container">
              <div
                v-for="(message, index) in chatStore.messages"
                :key="message.id"
                :class="['message', { own: message.userId === authStore.user?.id }]"
              >
                <div
                  v-if="index === 0 || (chatStore.messages[index - 1]?.userId ?? '') !== message.userId"
                  class="message-header"
                >
                  <span class="message-username">{{ message.user.username }}</span>
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                </div>
                <div v-else class="message-time-small">{{ formatTime(message.createdAt) }}</div>
                <p class="message-content">{{ message.content }}</p>
              </div>
            </div>
            
            <div v-if="chatStore.typingUsers.length > 0" class="typing-indicator">
              {{ chatStore.typingUsers.map(u => u.username).join(', ') }}
              {{ chatStore.typingUsers.length === 1 ? 'está' : 'están' }} escribiendo...
            </div>
            
            <footer class="chat-footer">
              <input
                v-model="newMessage"
                type="text"
                placeholder="Escribe un mensaje..."
                @keydown.enter="handleSendMessage"
                @input="handleTyping"
              />
              <button @click="handleSendMessage" :disabled="!newMessage.trim()">Enviar</button>
            </footer>
          </div>
          
          <aside class="participants-panel">
            <h3>Participantes</h3>
            <div class="participants-online">
              <span class="online-label">En línea ({{ onlineMembers.length }})</span>
              <div
                v-for="member in onlineMembers"
                :key="member.id"
                class="participant-item online"
              >
                <div class="participant-avatar">{{ member.username.charAt(0).toUpperCase() }}</div>
                <span class="participant-name">{{ member.username }}</span>
                <span class="status-dot online"></span>
              </div>
            </div>
          </aside>
        </div>
      </template>
      
      <div v-else class="no-room-selected">
        <h2>Selecciona una sala</h2>
        <p>Elige una sala de la lista para comenzar a chatear</p>
      </div>
    </main>
    
    <div v-if="showNewRoomModal" class="modal-overlay" @click.self="showNewRoomModal = false">
      <div class="modal">
        <h3>Crear nueva sala</h3>
        <form @submit.prevent="createRoom">
          <input
            v-model="newRoomName"
            type="text"
            placeholder="Nombre de la sala"
            maxlength="50"
            autofocus
          />
          <div class="modal-actions">
            <button type="button" class="cancel" @click="showNewRoomModal = false">Cancelar</button>
            <button type="submit" :disabled="!newRoomName.trim()">Crear</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.sidebar {
  width: 280px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.user-info {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.rooms-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rooms-header h3 {
  margin: 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.add-room-btn {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  transition: background 0.2s;
}

.add-room-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.rooms-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.rooms-list li {
  padding: 0.875rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.rooms-list li:hover {
  background: rgba(255, 255, 255, 0.1);
}

.rooms-list li.active {
  background: rgba(102, 126, 234, 0.3);
}

.room-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.private-badge {
  font-size: 0.625rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.members-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.chat-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.messages-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message {
  max-width: 70%;
  padding: 0.5rem 0.75rem;
}

.message.own {
  align-self: flex-end;
}

.message.own .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 4px 16px;
}

.message:not(.own) .message-content {
  background: #f0f0f0;
  border-radius: 16px 16px 16px 4px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
}

.message-username {
  font-weight: 600;
  font-size: 0.875rem;
  color: #333;
}

.message.own .message-username {
  color: #667eea;
}

.message-time {
  font-size: 0.75rem;
  color: #999;
}

.message-time-small {
  font-size: 0.625rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.message-content {
  margin: 0;
  padding: 0.5rem 0.75rem;
  word-wrap: break-word;
}

.typing-indicator {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

.chat-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.5rem;
}

.chat-footer input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.chat-footer input:focus {
  outline: none;
  border-color: #667eea;
}

.chat-footer button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.chat-footer button:hover:not(:disabled) {
  transform: scale(1.05);
}

.chat-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.participants-panel {
  width: 240px;
  border-left: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.participants-panel h3 {
  margin: 0;
  padding: 1rem;
  font-size: 0.875rem;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.online-label,
.offline-label {
  display: block;
  padding: 0.75rem 1rem 0.5rem;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
}

.participant-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
  color: white;
}

.participant-name {
  flex: 1;
  font-size: 0.875rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-item.offline .participant-name {
  color: #888;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #22c55e;
}

.status-dot.offline {
  background: #ccc;
}

.no-room-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.no-room-selected h2 {
  margin: 0 0 0.5rem;
  color: #666;
}

.no-room-selected p {
  margin: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
}

.modal h3 {
  margin: 0 0 1rem;
}

.modal input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1rem;
  box-sizing: border-box;
}

.modal input:focus {
  outline: none;
  border-color: #667eea;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.modal-actions button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.modal-actions button.cancel {
  background: #f0f0f0;
  color: #666;
}

.modal-actions button:not(.cancel) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-actions button:hover {
  opacity: 0.9;
}

.modal-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>