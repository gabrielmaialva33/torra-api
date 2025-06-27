import { inject } from '@adonisjs/core'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { DateTime } from 'luxon'
import OrdersRepository from '#modules/order/repositories/orders_repository'
import OrderNotification from '#modules/order/models/order_notification'
import INotification from '#modules/notification/interfaces/notification_interface'
import NotFoundException from '#exceptions/not_found_exception'

@inject()
export default class SendNotificationService {
  constructor(private ordersRepository: OrdersRepository) {}

  async sendOrderNotification(data: INotification.OrderNotificationData): Promise<void> {
    const order = await this.ordersRepository.findBy('id', data.orderId, {
      modifyQuery: (query) => {
        query.preload('customer').preload('store').preload('locker')
      },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    let recipient: { name: string; email: string; phone: string }
    let content: string

    if (data.recipientType === 'customer') {
      recipient = order.customer
    } else {
      recipient = {
        name: order.store.name,
        email: order.store.email,
        phone: order.store.phone,
      }
    }

    // Generate content based on notification type
    switch (data.type) {
      case 'order_ready':
        content = this.generateOrderReadyMessage(
          order,
          order.locker?.code || '',
          order.retrieval_code || ''
        )
        break
      case 'order_expiring':
        content = this.generateOrderExpiringMessage(order)
        break
      case 'order_cancelled':
        content = this.generateOrderCancelledMessage(order)
        break
      case 'order_received':
        content = this.generateOrderReceivedMessage(order)
        break
      default:
        throw new Error('Invalid notification type')
    }

    // Send via WhatsApp (mock for now)
    const whatsappResult = await this.sendWhatsApp({
      to: recipient.phone,
      message: content,
    })

    // Send via Email
    const emailResult = await this.sendEmail({
      to: recipient.email,
      subject: this.getEmailSubject(data.type, order.order_number),
      html: this.wrapInEmailTemplate(content),
      text: content,
    })

    // Record notification
    await OrderNotification.create({
      order_id: order.id,
      type: whatsappResult.success ? 'whatsapp' : 'email',
      status: whatsappResult.success || emailResult.success ? 'sent' : 'failed',
      sent_at: DateTime.now(),
      content,
      metadata: {
        recipient: whatsappResult.success ? recipient.phone : recipient.email,
        response: whatsappResult.success ? whatsappResult : emailResult,
        error: whatsappResult.success ? undefined : emailResult.error,
      },
    })
  }

  async sendWhatsApp(data: INotification.WhatsAppData): Promise<INotification.NotificationResult> {
    try {
      // TODO: Integrate with WhatsApp Business API
      // For now, we'll mock the response
      console.log('Sending WhatsApp message:', data)

      return {
        success: true,
        provider: 'whatsapp',
        messageId: `whatsapp_${Date.now()}`,
        sentAt: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'whatsapp',
        error: error.message,
        sentAt: new Date(),
      }
    }
  }

  async sendSMS(data: INotification.SMSData): Promise<INotification.NotificationResult> {
    try {
      // TODO: Integrate with SMS provider (Twilio, etc)
      console.log('Sending SMS:', data)

      return {
        success: true,
        provider: 'sms',
        messageId: `sms_${Date.now()}`,
        sentAt: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'sms',
        error: error.message,
        sentAt: new Date(),
      }
    }
  }

  async sendEmail(data: INotification.EmailData): Promise<INotification.NotificationResult> {
    try {
      const message = await mail.send((msg) => {
        msg
          .to(data.to as string)
          .from(
            env.get('SMTP_FROM_ADDRESS') || 'noreply@lojastorra.com.br',
            env.get('SMTP_FROM_NAME') || 'Lojas Torra'
          )
          .subject(data.subject)

        if (data.html) {
          msg.html(data.html)
        }
        if (data.text) {
          msg.text(data.text)
        }
      })

      return {
        success: true,
        provider: 'email',
        messageId: message.messageId,
        sentAt: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        provider: 'email',
        error: error.message,
        sentAt: new Date(),
      }
    }
  }

  private generateOrderReadyMessage(order: any, lockerCode: string, retrievalCode: string): string {
    return `Olá ${order.customer.name}!
    
Seu pedido ${order.order_number} está disponível para retirada na loja ${order.store.name}.

📍 Locker: ${lockerCode}
🔑 Código de retirada: ${retrievalCode}

⏰ Prazo para retirada: ${order.expiration_date.toFormat('dd/MM/yyyy')}

Endereço: ${order.store.address.street}, ${order.store.address.number} - ${order.store.address.neighborhood}

Não esqueça de levar um documento com foto!`
  }

  private generateOrderExpiringMessage(order: any): string {
    const daysLeft = order.daysUntilExpiration
    return `⚠️ Atenção ${order.customer.name}!
    
Seu pedido ${order.order_number} expira em ${daysLeft} dias.

📍 Loja: ${order.store.name}
🔑 Código de retirada: ${order.retrieval_code || 'Use seu CPF'}

Retire seu pedido até ${order.expiration_date.toFormat('dd/MM/yyyy')} para evitar o cancelamento.`
  }

  private generateOrderCancelledMessage(order: any): string {
    return `Olá ${order.customer.name},
    
Seu pedido ${order.order_number} foi cancelado.

Motivo: ${order.cancellation_reason || 'Prazo de retirada expirado'}

Se você tiver dúvidas, entre em contato com nossa central de atendimento.`
  }

  private generateOrderReceivedMessage(order: any): string {
    return `Olá ${order.customer.name}!
    
Confirmamos o recebimento do seu pedido ${order.order_number} na loja ${order.store.name}.

Em breve você receberá uma nova mensagem quando seu pedido estiver disponível para retirada.

Acompanhe o status do seu pedido através do nosso site.`
  }

  private getEmailSubject(
    type: INotification.OrderNotificationData['type'],
    orderNumber: string
  ): string {
    const subjects = {
      order_ready: `✅ Pedido ${orderNumber} disponível para retirada`,
      order_expiring: `⚠️ Seu pedido ${orderNumber} está prestes a expirar`,
      order_cancelled: `❌ Pedido ${orderNumber} cancelado`,
      order_received: `📦 Pedido ${orderNumber} recebido na loja`,
    }
    return subjects[type]
  }

  private wrapInEmailTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5101; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Lojas Torra - Clique e Retire</h1>
        </div>
        <div class="content">
            <pre>${content}</pre>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Lojas Torra. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>`
  }
}
