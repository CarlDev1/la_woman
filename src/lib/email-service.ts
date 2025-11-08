import { supabase } from './supabase'

const APP_URL = window.location.origin

export const sendWelcomeEmail = async (email: string, name: string, confirmationUrl: string) => {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: '🎉 Bienvenue sur LA WOMAN - Confirmez votre email',
      type: 'welcome_confirmation',
      data: {
        name,
        confirmationUrl
      }
    }
  })

  if (error) {
    console.error('Error sending welcome email:', error)
    throw error
  }

  return data
}

export const sendNewRegistrationEmail = async (adminEmail: string, userName: string, userEmail: string, userPhone: string) => {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: adminEmail,
      subject: '📝 Nouvelle inscription en attente - LA WOMAN',
      type: 'new_registration',
      data: {
        name: userName,
        email: userEmail,
        phone: userPhone,
        adminUrl: `${APP_URL}/admin/pending`
      }
    }
  })

  if (error) {
    console.error('Error sending admin notification:', error)
    throw error
  }

  return data
}

export const sendValidationEmail = async (email: string, name: string) => {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: '🎉 Votre compte LA WOMAN est activé !',
      type: 'account_approved',
      data: {
        name,
        loginUrl: `${APP_URL}/login`
      }
    }
  })

  if (error) {
    console.error('Error sending validation email:', error)
    throw error
  }

  return data
}

export const sendRejectionEmail = async (email: string, name: string) => {
  const { data, error} = await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: 'Inscription LA WOMAN',
      type: 'account_rejected',
      data: {
        name
      }
    }
  })

  if (error) {
    console.error('Error sending rejection email:', error)
    throw error
  }

  return data
}