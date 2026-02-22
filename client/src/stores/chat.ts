import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Room, Message, OnlineUser } from '../assets/types'
import { roomApi } from '../services.ts/api'
import { useAuthStore } from './auth'
import { useWebSocket } from '../composables/useSocket'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export const useChatStore = defineStore('chat', () => {
  const rooms = ref<Room[]>([])
  const currentRoom = ref<Room | null>(null)
  const messages = ref<Message[]>([])
  const roomMembers = ref<Pick<import('../assets/types').User, 'id' | 'username' | 'avatar'>[]>([])
  const onlineUsers = ref<OnlineUser[]>([])
  const typingUsers = ref<OnlineUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const ws = useWebSocket()

  const typingTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  const isInRoom = computed(() => !!currentRoom.value)

  async function fetchRooms(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      rooms.value = await roomApi.getRooms()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error || 'Error al cargar las salas'
    } finally {
      loading.value = false
    }
  }

  async function createRoom(name: string): Promise<Room | null> {
    loading.value = true
    error.value = null
    try {
      const room = await roomApi.createRoom(name)
      rooms.value.unshift(room)
      return room
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error || 'Error al crear la sala'
      return null
    } finally {
      loading.value = false
    }
  }

  async function joinRoom(roomId: string): Promise<void> {
    const authStore = useAuthStore()
    loading.value = true
    error.value = null

    try {
      try {
        await roomApi.joinRoom(roomId)
      } catch (joinErr) {
        const axiosErr = joinErr as { response?: { data?: { error?: string } } }
        if (axiosErr.response?.data?.error !== 'Ya eres miembro de esta sala') {
          throw joinErr
        }
      }
      
      currentRoom.value = rooms.value.find(r => r.id === roomId) || null

      const [fetchedMessages, fetchedMembers] = await Promise.all([
        roomApi.getRoomMessages(roomId),
        roomApi.getRoomMembers(roomId),
      ])

      messages.value = fetchedMessages
      roomMembers.value = fetchedMembers

      if (!ws.isConnected.value) {
        ws.connect(SOCKET_URL)
      }

      ws.send('join_room', {
        userId: authStore.user?.id,
        username: authStore.user?.username,
        roomId,
      })

      setupWebSocketListeners()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error || 'Error al unirse a la sala'
    } finally {
      loading.value = false
    }
  }

  function leaveCurrentRoom(): void {
    if (!currentRoom.value) return

    const authStore = useAuthStore()

    roomApi.leaveRoom(currentRoom.value.id).catch(() => {})

    ws.send('leave_room', { roomId: currentRoom.value.id })

    currentRoom.value = null
    messages.value = []
    roomMembers.value = []
    onlineUsers.value = []
    typingUsers.value = []
  }

  async function sendMessage(content: string): Promise<void> {
    if (!currentRoom.value) return

    const authStore = useAuthStore()

    try {
      const message = await roomApi.sendMessage(currentRoom.value.id, content)
      messages.value.push(message)

      ws.send('send_message', {
        roomId: currentRoom.value.id,
        message: content,
        userId: authStore.user?.id,
        username: authStore.user?.username,
      })
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error || 'Error al enviar el mensaje'
    }
  }

  function handleTyping(): void {
    const authStore = useAuthStore()
    if (!authStore.user || !currentRoom.value) return

    const existingTyping = typingUsers.value.find(u => u.userId === authStore.user?.id)
    if (existingTyping) return

    ws.send('typing', {
      roomId: currentRoom.value.id,
      username: authStore.user.username,
      userId: authStore.user.id,
    })

    typingUsers.value.push({
      userId: authStore.user.id,
      username: authStore.user.username,
    })

    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
    }

    typingTimeout.value = setTimeout(() => {
      typingUsers.value = typingUsers.value.filter(u => u.userId !== authStore.user?.id)
    }, 2000)
  }

  function setupWebSocketListeners() {
    ws.on('new_message', (data) => {
      const msg = data as { id: string; content: string; userId: string; username: string; createdAt: string }
      const authStore = useAuthStore()
      
      if (msg.userId !== authStore.user?.id) {
        messages.value.push({
          id: msg.id,
          content: msg.content,
          userId: msg.userId,
          roomId: currentRoom.value?.id || '',
          createdAt: msg.createdAt,
          user: { id: msg.userId, username: msg.username, avatar: null },
        })
      }
    })

    ws.on('users_in_room', (data) => {
      const users = data as OnlineUser[]
      const authStore = useAuthStore()
      
      onlineUsers.value = users.filter(u => u.userId !== authStore.user?.id)
    })

    ws.on('user_typing', (data) => {
      const { userId, username } = data as { userId: string; username: string }
      const authStore = useAuthStore()
      
      if (userId !== authStore.user?.id) {
        const existing = typingUsers.value.find(u => u.userId === userId)
        if (!existing) {
          typingUsers.value.push({ userId, username })
          
          if (typingTimeout.value) {
            clearTimeout(typingTimeout.value)
          }
          
          typingTimeout.value = setTimeout(() => {
            typingUsers.value = typingUsers.value.filter(u => u.userId !== userId)
          }, 2000)
        }
      }
    })
  }

  function cleanupSocketListeners() {
    ws.disconnect()
  }

  function setupSocketListeners() {
    // WebSocket is connected when joining a room
  }

  return {
    rooms,
    currentRoom,
    messages,
    roomMembers,
    onlineUsers,
    typingUsers,
    loading,
    error,
    isInRoom,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveCurrentRoom,
    sendMessage,
    handleTyping,
    setupSocketListeners,
    cleanupSocketListeners,
  }
})
