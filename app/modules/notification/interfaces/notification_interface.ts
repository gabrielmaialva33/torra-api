namespace INotification {
  export interface WhatsAppData {
    to: string
    message: string
    template?: string
    templateParams?: Record<string, any>
  }

  export interface SMSData {
    to: string
    message: string
  }

  export interface EmailData {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    template?: string
    templateData?: Record<string, any>
  }

  export interface NotificationResult {
    success: boolean
    provider: 'whatsapp' | 'sms' | 'email'
    messageId?: string
    error?: string
    sentAt: Date
  }

  export interface Provider {
    send(data: any): Promise<NotificationResult>
  }

  export interface WhatsAppProvider extends Provider {
    send(data: WhatsAppData): Promise<NotificationResult>
  }

  export interface SMSProvider extends Provider {
    send(data: SMSData): Promise<NotificationResult>
  }

  export interface EmailProvider extends Provider {
    send(data: EmailData): Promise<NotificationResult>
  }

  export interface OrderNotificationData {
    orderId: number
    type: 'order_ready' | 'order_expiring' | 'order_cancelled' | 'order_received'
    recipientType: 'customer' | 'store'
  }

  export interface NotificationTemplate {
    name: string
    type: 'whatsapp' | 'sms' | 'email'
    subject?: string
    content: string
    variables: string[]
  }

  export const Templates = {
    ORDER_READY: 'order_ready',
    ORDER_EXPIRING: 'order_expiring',
    ORDER_CANCELLED: 'order_cancelled',
    ORDER_RECEIVED: 'order_received',
    RETRIEVAL_CODE: 'retrieval_code',
  }
}

export default INotification
