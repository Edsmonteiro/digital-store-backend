'use strict';

module.exports = {
  async up(queryInterface) {
    // No MySQL, a chave estrangeira pode criar automaticamente um índice
    // para category_id. Evitamos outro igual antes de alterar a tabela.
    const indexes = await queryInterface.showIndex('product_categories');
    const hasCategoryIndex = indexes.some(index =>
      index.fields?.[0]?.attribute === 'category_id'
    );
    if (!hasCategoryIndex) {
      await queryInterface.addIndex('product_categories', ['category_id'], {
        name: 'idx_product_categories_category_id'
      });
    }

    // O filtro price-range precisa encontrar valores dentro de um intervalo.
    await queryInterface.addIndex('products', ['price'], {
      name: 'idx_products_price'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('products', 'idx_products_price');

    const indexes = await queryInterface.showIndex('product_categories');
    if (indexes.some(index => index.name === 'idx_product_categories_category_id')) {
      await queryInterface.removeIndex('product_categories', 'idx_product_categories_category_id');
    }
  }
};
