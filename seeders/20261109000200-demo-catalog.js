'use strict';
const cdn = 'https://raw.githubusercontent.com/digitalcollegebr/projeto-digital-store/main/public/';
const items = [
  ['Tênis Street Move', 1, 299.90, 219.90, 'product-thumb-1.jpeg'],
  ['Tênis Court Classic', 1, 349.90, 289.90, 'product-thumb-2.jpeg'],
  ['Tênis Urban Runner', 1, 399.90, 319.90, 'product-thumb-3.jpeg'],
  ['Tênis Casual Canvas', 1, 259.90, 0, 'product-thumb-4.jpeg'],
  ['Tênis Daily Comfort', 1, 329.90, 269.90, 'product-thumb-5.jpeg'],
  ['Camiseta Essential', 2, 119.90, 89.90, 'produc-image-1.jpeg'],
  ['Camiseta Sport Line', 2, 139.90, 0, 'produc-image-2.jpeg'],
  ['Jaqueta Urban', 2, 289.90, 229.90, 'produc-image-3.jpeg'],
  ['Bolsa Everyday', 3, 189.90, 149.90, 'produc-image-4.jpeg'],
  ['Boné Street', 3, 99.90, 79.90, 'produc-image-5.jpeg']
];
const descriptions = [
  'Tênis casual para usar com jeans, bermuda ou calça. Uma opção para quem prefere um visual mais básico.',
  'Modelo com inspiração nos tênis de quadra, para combinar com roupas casuais.',
  'Tênis com visual esportivo, que também funciona com looks do dia a dia.',
  'Uma opção simples para quem gosta de tênis de lona e combinações mais descontraídas.',
  'Tênis casual de linhas discretas, fácil de combinar com peças básicas.',
  'Camiseta para quem gosta de roupas simples e de montar o próprio conjunto.',
  'Camiseta de visual esportivo, para usar com short, calça ou bermuda.',
  'Jaqueta para completar uma produção casual nos dias mais frescos.',
  'Bolsa para levar os itens do dia a dia, sem abrir mão de um visual mais casual.',
  'Boné para usar com camiseta, jaqueta ou o que mais combinar com você.'
];
const slugify = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
module.exports = {
  async up(queryInterface, Sequelize) {
    const [found] = await queryInterface.sequelize.query('SELECT id FROM products LIMIT 1');
    if (found.length) return; // seed é segura contra repetição em um banco já populado.
    const now = new Date();
    const categoryRows = [
      { name: 'Calçados', slug: 'calcados', use_in_menu: true },
      { name: 'Roupas', slug: 'roupas', use_in_menu: true },
      { name: 'Acessórios', slug: 'acessorios', use_in_menu: true }
    ];
    const [existingCategories] = await queryInterface.sequelize.query('SELECT id,slug FROM categories');
    if (!existingCategories.length) await queryInterface.bulkInsert('categories', categoryRows.map(row => ({ ...row, created_at: now, updated_at: now })));
    const [categories] = await queryInterface.sequelize.query('SELECT id,slug FROM categories');
    const map = Object.fromEntries(categories.map(row => [row.slug, row.id]));
    const slugs = ['calcados', 'roupas', 'acessorios'];
    const products = items.map(([name, group, price, price_with_discount], index) => ({
      enabled: true, name, slug: slugify(name), use_in_menu: group === 1,
      stock: 20, description: descriptions[index],
      price, price_with_discount, created_at: now, updated_at: now
    }));
    await queryInterface.bulkInsert('products', products);
    const [saved] = await queryInterface.sequelize.query('SELECT id, slug FROM products');
    const bySlug = Object.fromEntries(saved.map(row => [row.slug, row.id]));
    const categoryLinks = [], images = [], options = [];
    items.forEach(([name, group, , , file], index) => {
      const product_id = bySlug[slugify(name)];
      categoryLinks.push({ product_id, category_id: map[slugs[group - 1]] });
      images.push({ product_id, enabled: true, path: cdn + file });
      options.push({ product_id, title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: group === 1 ? '37,38,39,40,41,42' : group === 2 ? 'P,M,G,GG' : 'Único' });
      options.push({ product_id, title: 'Cor', shape: 'circle', radius: 50, type: 'color', values: '#262626,#dad2c8,#9e6489' });
    });
    await queryInterface.bulkInsert('product_categories', categoryLinks);
    await queryInterface.bulkInsert('product_images', images);
    await queryInterface.bulkInsert('product_options', options);
  },
  async down(queryInterface, Sequelize) {
    const slugs = items.map(row => slugify(row[0]));
    await queryInterface.bulkDelete('products', { slug: { [Sequelize.Op.in]: slugs } });
    await queryInterface.bulkDelete('categories', { slug: { [Sequelize.Op.in]: ['calcados', 'roupas', 'acessorios'] } });
  }
};
