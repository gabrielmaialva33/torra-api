import { DateTime } from 'luxon'
import Factory from '@adonisjs/lucid/factories'

import type { OrderStatus } from '#modules/order/models/order'
import OrderStatusHistory from '#modules/order/models/order_status_history'
import { UserFactory } from '#database/factories/user_factory'

const statusTransitionReasons: Record<string, string[]> = {
  sent_to_received: [
    'Pedido conferido e validado',
    'Mercadoria recebida sem avarias',
    'Documentação verificada',
  ],
  received_to_awaiting_storage: [
    'Aguardando locker disponível',
    'Pedido em fila para armazenamento',
    'Processamento interno',
  ],
  awaiting_storage_to_stored: [
    'Locker alocado com sucesso',
    'Pedido armazenado no locker',
    'Cliente notificado',
  ],
  stored_to_awaiting_retrieval: [
    'Cliente iniciou processo de retirada',
    'Código de retirada validado',
  ],
  awaiting_retrieval_to_retrieved: [
    'Pedido entregue ao cliente',
    'Retirada confirmada',
    'Identidade verificada',
  ],
  any_to_cancellation_pending: [
    'Solicitação de cancelamento recebida',
    'Iniciado processo de cancelamento',
    'Aguardando aprovação para cancelamento',
  ],
  cancellation_pending_to_cancelled: [
    'Cancelamento aprovado',
    'Pedido cancelado conforme solicitação',
    'Devolução processada',
  ],
  any_to_expired: [
    'Prazo de retirada expirado',
    'Pedido não retirado no prazo',
    'Expiração automática após 30 dias',
  ],
}

export const OrderStatusHistoryFactory = Factory.define(OrderStatusHistory, ({ faker }) => {
  const transitions: Array<{ from: OrderStatus | null; to: OrderStatus }> = [
    { from: null, to: 'sent' },
    { from: 'sent', to: 'received' },
    { from: 'received', to: 'awaiting_storage' },
    { from: 'awaiting_storage', to: 'stored' },
    { from: 'stored', to: 'awaiting_retrieval' },
    { from: 'awaiting_retrieval', to: 'retrieved' },
  ]

  const transition = faker.helpers.arrayElement(transitions)
  const transitionKey = transition.from
    ? `${transition.from}_to_${transition.to}`
    : `any_to_${transition.to}`
  const reasons = statusTransitionReasons[transitionKey] || ['Status atualizado']

  return {
    order_id: 1, // Will be overridden by relationship
    from_status: transition.from,
    to_status: transition.to,
    changed_by: 1, // Will be overridden by relationship
    reason: faker.helpers.arrayElement(reasons),
    metadata: {
      ip_address: faker.internet.ipv4(),
      user_agent: faker.internet.userAgent(),
      location: faker.helpers.arrayElement([
        'Backoffice',
        'Mobile App',
        'Store Terminal',
        'API Integration',
        'Automated Process',
      ]),
      device_type: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet', 'terminal']),
      ...(transition.to === 'stored' && {
        locker_code: faker.string.alphanumeric({ length: 3, casing: 'upper' }),
        notification_sent: true,
      }),
      ...(transition.to === 'retrieved' && {
        verification_method: faker.helpers.arrayElement(['cpf', 'retrieval_code', 'qr_code']),
        customer_verified: true,
      }),
      ...(transition.to === 'cancelled' && {
        refund_status: faker.helpers.arrayElement(['pending', 'processed', 'not_applicable']),
        cancellation_type: faker.helpers.arrayElement([
          'customer_request',
          'system',
          'store_request',
        ]),
      }),
    },
    created_at: DateTime.now().minus({ hours: faker.number.int({ min: 1, max: 168 }) }),
  }
})
  .state('manual', (history) => {
    history.metadata = {
      ...history.metadata,
      manual_update: true,
      update_source: 'user_interface',
    }
  })
  .state('automated', (history) => {
    history.metadata = {
      ...history.metadata,
      automated: true,
    }
  })
  .state('cancellation', (history, { faker }) => {
    history.from_status = faker.helpers.arrayElement([
      'sent',
      'received',
      'awaiting_storage',
      'stored',
    ])
    history.to_status = 'cancellation_pending'
    history.reason = faker.helpers.arrayElement([
      'Cliente solicitou cancelamento',
      'Produto indisponível',
      'Erro no pedido',
      'Problema no pagamento',
    ])
    history.metadata = {
      ...history.metadata,
    }
  })
  .state('expiration', (history, { faker }) => {
    history.from_status = faker.helpers.arrayElement(['stored', 'awaiting_retrieval'])
    history.to_status = 'expired'
    history.reason = 'Prazo de retirada expirado - 30 dias'
    history.metadata = {
      ...history.metadata,
      automated: true,
      days_in_storage: 30,
    }
  })
  .relation('user', () => UserFactory)
  .build()
