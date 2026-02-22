import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(20)
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

export const createRoomSchema = z.object({
  name: z.string().min(1, 'El nombre de la sala es requerido').max(50),
  isPrivate: z.boolean().optional()
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(5000),
  roomId: z.string().uuid('ID de sala inválido')
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>