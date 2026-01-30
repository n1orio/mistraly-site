// app/api/check-nick/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Валидация никнейма Майнкрафт
function validateMinecraftNick(nick: string) {
  const errors: string[] = []
  
  // Проверка длины (3-16 символов)
  if (nick.length < 3) {
    errors.push('Никнейм должен быть не менее 3 символов')
  }
  
  if (nick.length > 16) {
    errors.push('Никнейм должен быть не более 16 символов')
  }
  
  // Проверка на пробелы
  if (/\s/.test(nick)) {
    errors.push('Никнейм не может содержать пробелов')
  }
  
  // Проверка на кириллицу
  if (/[а-яА-ЯёЁ]/.test(nick)) {
    errors.push('Никнейм не может содержать кириллические символы')
  }
  
  // Проверка на допустимые символы (только латиница, цифры, подчеркивание)
  if (!/^[a-zA-Z0-9_]+$/.test(nick)) {
    errors.push('Никнейм может содержать только латинские буквы, цифры и подчеркивания')
  }
  
  // Проверка на начало и конец подчеркиванием
  if (nick.startsWith('_')) {
    errors.push('Никнейм не может начинаться с подчеркивания')
  }
  
  if (nick.endsWith('_')) {
    errors.push('Никнейм не может заканчиваться подчеркиванием')
  }
  
  // Проверка на несколько подчеркиваний подряд
  if (/_{2,}/.test(nick)) {
    errors.push('Никнейм не может содержать несколько подчеркиваний подряд')
  }
  
  // Проверка на наличие хотя бы одной буквы
  if (!/[a-zA-Z]/.test(nick)) {
    errors.push('Никнейм должен содержать хотя бы одну букву')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const nick = searchParams.get('nick')
    
    if (!nick) {
      return NextResponse.json(
        { 
          error: 'Никнейм обязателен',
          available: false,
          validation: {
            valid: false,
            errors: ['Никнейм обязателен']
          }
        },
        { status: 400 }
      )
    }
    
    // Валидация формата никнейма
    const validation = validateMinecraftNick(nick)
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          available: false,
          validation: {
            valid: false,
            errors: validation.errors
          }
        },
        { status: 200 }
      )
    }
    
    // Проверяем, занят ли ник
    const existingUser = await prisma.user.findFirst({
      where: { minecraftNick: nick }
    })
    
    return NextResponse.json(
      { 
        available: !existingUser,
        validation: {
          valid: true,
          errors: []
        },
        message: existingUser 
          ? 'Никнейм уже занят' 
          : 'Этот никнейм доступен'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking nickname:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        available: false,
        validation: {
          valid: false,
          errors: ['Server error occurred']
        }
      },
      { status: 500 }
    )
  }
}