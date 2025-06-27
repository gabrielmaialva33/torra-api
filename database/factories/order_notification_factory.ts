import { DateTime } from 'luxon'
import Factory from '@adonisjs/lucid/factories'

import type { NotificationStatus, NotificationType } from '#modules/order/models/order_notification'
import OrderNotification from '#modules/order/models/order_notification'

const notificationTemplates = {
  whatsapp: {
    order_received: (code: string) =>
      `🎉 Ótima notícia! Seu pedido ${code} chegou na loja e está sendo preparado para retirada.`,
    order_stored: (code: string, retrievalCode: string) =>
      `📦 Seu pedido ${code} está pronto para retirada!\n\n` +
      `🔐 Código de retirada: ${retrievalCode}\n` +
      `📍 Retire na loja em até 30 dias.\n\n` +
      `Apresente este código no balcão de atendimento.`,
    reminder: (code: string, days: number) =>
      `⏰ Lembrete: Seu pedido ${code} está aguardando retirada há ${days} dias. ` +
      `Não esqueça de buscá-lo!`,
    expiring_soon: (code: string, days: number) =>
      `⚠️ Atenção! Seu pedido ${code} expira em ${days} dias. ` +
      `Após este prazo, o pedido será devolvido.`,
  },
  sms: {
    order_received: (code: string) => `Loja Torra: Pedido ${code} recebido na loja.`,
    order_stored: (code: string, retrievalCode: string) =>
      `Loja Torra: Pedido ${code} pronto! Código: ${retrievalCode}`,
    reminder: (code: string) => `Loja Torra: Não esqueça de retirar seu pedido ${code}`,
  },
  email: {
    order_received: (code: string) =>
      `<h2>Pedido Recebido</h2>` +
      `<p>Informamos que seu pedido <strong>${code}</strong> foi recebido em nossa loja.</p>`,
    order_stored: (code: string, retrievalCode: string) =>
      `<h2>Pedido Disponível para Retirada</h2>` +
      `<p>Seu pedido <strong>${code}</strong> está pronto!</p>` +
      `<p>Código de retirada: <strong>${retrievalCode}</strong></p>`,
  },
}

export const OrderNotificationFactory = Factory.define(OrderNotification, ({ faker }) => {
  const type: NotificationType = faker.helpers.arrayElement(['whatsapp', 'sms', 'email'])
  const status: NotificationStatus = faker.helpers.weightedArrayElement([
    { value: 'sent', weight: 80 },
    { value: 'pending', weight: 15 },
    { value: 'failed', weight: 5 },
  ]) as NotificationStatus

  const templateType = faker.helpers.arrayElement(['order_received', 'order_stored', 'reminder'])
  const orderCode = `PED${faker.number.int({ min: 10000, max: 99999 })}`
  const retrievalCode = faker.string.alphanumeric({ length: 6, casing: 'upper' })

  let content = ''
  if (type === 'whatsapp') {
    if (templateType === 'order_stored') {
      content = notificationTemplates.whatsapp.order_stored(orderCode, retrievalCode)
    } else if (templateType === 'reminder') {
      content = notificationTemplates.whatsapp.reminder(
        orderCode,
        faker.number.int({ min: 5, max: 25 })
      )
    } else {
      content = notificationTemplates.whatsapp.order_received(orderCode)
    }
  } else if (type === 'sms') {
    if (templateType === 'order_stored') {
      content = notificationTemplates.sms.order_stored(orderCode, retrievalCode)
    } else if (templateType === 'reminder') {
      content = notificationTemplates.sms.reminder(orderCode)
    } else {
      content = notificationTemplates.sms.order_received(orderCode)
    }
  } else {
    if (templateType === 'order_stored') {
      content = notificationTemplates.email.order_stored(orderCode, retrievalCode)
    } else {
      content = notificationTemplates.email.order_received(orderCode)
    }
  }

  return {
    order_id: 1, // Will be overridden by relationship
    type,
    status,
    sent_at:
      status === 'sent'
        ? DateTime.now().minus({ minutes: faker.number.int({ min: 1, max: 60 }) })
        : null,
    content,
    metadata: {
      recipient: type === 'email' ? faker.internet.email() : faker.phone.number(),
      template_id: `${type}_${templateType}`,
      provider: type === 'whatsapp' ? 'twilio' : type === 'sms' ? 'zenvia' : 'sendgrid',
      attempts: status === 'failed' ? faker.number.int({ min: 1, max: 3 }) : 1,
      ...(status === 'sent' && {
        response: {
          message_id: faker.string.uuid(),
          status: 'delivered',
          timestamp: DateTime.now().toISO(),
        },
      }),
      ...(status === 'failed' && {
        error: faker.helpers.arrayElement([
          'Invalid phone number',
          'Message delivery failed',
          'Provider timeout',
          'Rate limit exceeded',
        ]),
        last_attempt: DateTime.now().minus({ minutes: 5 }).toISO(),
      }),
    },
  }
})
  .state('whatsapp', (notification, { faker }) => {
    notification.type = 'whatsapp'
    notification.metadata.recipient = faker.phone.number()
    notification.metadata = {
      ...notification.metadata,
      recipient: faker.phone.number(),
    }
  })
  .state('sms', (notification, { faker }) => {
    notification.type = 'sms'
    notification.metadata = {
      ...notification.metadata,
      recipient: faker.phone.number(),
    }
  })
  .state('email', (notification, { faker }) => {
    notification.type = 'email'
    notification.metadata = {
      ...notification.metadata,
      recipient: faker.internet.email(),
    }
  })
  .state('sent', (notification, { faker }) => {
    notification.status = 'sent'
    notification.sent_at = DateTime.now().minus({ minutes: faker.number.int({ min: 1, max: 120 }) })
    notification.metadata = {
      ...notification.metadata,
      response: {
        message_id: faker.string.uuid(),
        status: 'delivered',
        timestamp: notification.sent_at!.toISO(),
      },
    }
  })
  .state('failed', (notification, { faker }) => {
    notification.status = 'failed'
    notification.sent_at = null
    notification.metadata = {
      ...notification.metadata,
      attempts: faker.number.int({ min: 1, max: 5 }),
      error: faker.helpers.arrayElement([
        'Invalid recipient',
        'Provider error',
        'Network timeout',
        'Authentication failed',
      ]),
    }
  })
  .state('pending', (notification) => {
    notification.status = 'pending'
    notification.sent_at = null
    notification.metadata = {
      ...notification.metadata,
    }
  })
  .build()
