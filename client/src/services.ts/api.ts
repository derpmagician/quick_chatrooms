import axios, { type AxiosError } from 'axios'
import type { AuthResponse, Room, Message, User } from '../assets/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: async (email: string, username: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, username, password })
    return data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    return data
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<{ user: User }>('/auth/me')
    return data.user
  },
}

export const roomApi = {
  getRooms: async (): Promise<Room[]> => {
    const { data } = await api.get<{ rooms: Room[] }>('/rooms')
    return data.rooms
  },

  createRoom: async (name: string, isPrivate = false): Promise<Room> => {
    const { data } = await api.post<{ room: Room }>('/rooms', { name, isPrivate })
    return data.room
  },

  joinRoom: async (roomId: string): Promise<void> => {
    await api.post(`/rooms/${roomId}/join`)
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    await api.post(`/rooms/${roomId}/leave`)
  },

  getRoomMembers: async (roomId: string): Promise<Pick<User, 'id' | 'username' | 'avatar'>[]> => {
    const { data } = await api.get<{ members: Pick<User, 'id' | 'username' | 'avatar'>[] }>(`/rooms/${roomId}/members`)
    return data.members
  },

  getRoomMessages: async (roomId: string, limit = 50): Promise<Message[]> => {
    const { data } = await api.get<{ messages: Message[] }>(`/rooms/${roomId}/messages?limit=${limit}`)
    return data.messages
  },

  sendMessage: async (roomId: string, content: string): Promise<Message> => {
    const { data } = await api.post<{ message: Message }>(`/rooms/${roomId}/messages`, { content })
    return data.message
  },
}

export default api
