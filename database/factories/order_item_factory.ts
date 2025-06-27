import OrderItem from '#modules/order/models/order_item'
import Factory from '@adonisjs/lucid/factories'

const products = [
  { name: 'Smartphone Samsung Galaxy', category: 'electronics', priceRange: [1000, 5000] },
  { name: 'Notebook Dell Inspiron', category: 'electronics', priceRange: [2500, 6000] },
  { name: 'Fone de Ouvido JBL', category: 'electronics', priceRange: [150, 800] },
  { name: 'Smart TV LG 50"', category: 'electronics', priceRange: [2000, 4000] },
  { name: 'Tênis Nike Air Max', category: 'fashion', priceRange: [300, 800] },
  { name: 'Camisa Polo Lacoste', category: 'fashion', priceRange: [200, 500] },
  { name: 'Bolsa Michael Kors', category: 'fashion', priceRange: [500, 2000] },
  { name: 'Relógio Casio', category: 'accessories', priceRange: [200, 1500] },
  { name: 'Perfume Dior Sauvage', category: 'beauty', priceRange: [300, 700] },
  { name: 'Kit Maquiagem MAC', category: 'beauty', priceRange: [200, 600] },
  { name: 'Cafeteira Nespresso', category: 'home', priceRange: [400, 1200] },
  { name: 'Panela Elétrica Electrolux', category: 'home', priceRange: [200, 500] },
  { name: 'Livro Best Seller', category: 'books', priceRange: [30, 80] },
  { name: 'Jogo PS5', category: 'games', priceRange: [200, 350] },
  { name: 'Brinquedo LEGO', category: 'toys', priceRange: [100, 500] },
]

export const OrderItemFactory = Factory.define(OrderItem, ({ faker }) => {
  const product = faker.helpers.arrayElement(products)
  const price = faker.number.float({
    min: product.priceRange[0],
    max: product.priceRange[1],
    fractionDigits: 2,
  })

  return {
    order_id: 1, // Will be overridden by relationship
    product_name: product.name,
    quantity: faker.helpers.weightedArrayElement([
      { value: 1, weight: 60 }, // 60% single item
      { value: 2, weight: 25 }, // 25% two items
      { value: 3, weight: 10 }, // 10% three items
      { value: faker.number.int({ min: 4, max: 10 }), weight: 5 }, // 5% bulk
    ]),
    sku: `SKU-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
    price,
    metadata: {
      category: product.category,
      brand: product.name.split(' ')[1] || faker.company.name(),
      color: faker.helpers.maybe(() => faker.color.human(), { probability: 0.7 }),
      size: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['PP', 'P', 'M', 'G', 'GG', 'XG']),
        { probability: product.category === 'fashion' ? 0.9 : 0.1 }
      ),
      weight: faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }),
      dimensions: {
        length: faker.number.int({ min: 10, max: 50 }),
        width: faker.number.int({ min: 10, max: 50 }),
        height: faker.number.int({ min: 5, max: 30 }),
      },
      warranty_months: faker.helpers.maybe(() => faker.helpers.arrayElement([3, 6, 12, 24]), {
        probability: product.category === 'electronics' ? 0.9 : 0.2,
      }),
    },
  }
})
  .state('electronic', (item, { faker }) => {
    const electronic = faker.helpers.arrayElement(
      products.filter((p) => p.category === 'electronics')
    )
    item.product_name = electronic.name
    item.price = faker.number.float({
      min: electronic.priceRange[0],
      max: electronic.priceRange[1],
      fractionDigits: 2,
    })
    item.metadata.category = 'electronics'
    item.metadata.warranty_months = faker.helpers.arrayElement([12, 24, 36])
  })
  .state('fashion', (item, { faker }) => {
    const fashion = faker.helpers.arrayElement(products.filter((p) => p.category === 'fashion'))
    item.product_name = fashion.name
    item.price = faker.number.float({
      min: fashion.priceRange[0],
      max: fashion.priceRange[1],
      fractionDigits: 2,
    })
    item.metadata.category = 'fashion'
    item.metadata.size = faker.helpers.arrayElement(['PP', 'P', 'M', 'G', 'GG', 'XG'])
    item.metadata.color = faker.color.human()
  })
  .state('gift', (item, { faker }) => {
    item.metadata = {
      ...item.metadata,
      is_gift: true,
      gift_wrap: true,
      gift_message: faker.lorem.sentence(),
      recipient_name: faker.person.fullName(),
    }
  })
  .state('fragile', (item) => {
    item.metadata = {
      ...item.metadata,
      fragile: true,
      handling_instructions: 'Handle with care - Fragile item',
      requires_signature: true,
    }
  })
  .build()
