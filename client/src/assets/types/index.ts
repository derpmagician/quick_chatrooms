export interface User {
  id: string
  email: string
  username: string
  avatar: string | null
  createdAt: string
}

export interface Room {
  id: string
  name: string
  isPrivate: boolean
  ownerId: string
  owner: Pick<User, 'id' | 'username' | 'avatar'>
  _count?: { members: number }
  createdAt: string
}

export interface Message {
  id: string
  content: string
  userId: string
  roomId: string
  createdAt: string
  user: Pick<User, 'id' | 'username' | 'avatar'>
}

export interface OnlineUser {
  userId: string
  username: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiError {
  error: string
}