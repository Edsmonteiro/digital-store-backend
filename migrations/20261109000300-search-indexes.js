'use strict';

module.exports = {
  async up(queryInterface) {
    // A chave composta começa pelo produto, então o filtro por categoria
    // precisa de um índice próprio para evitar varrer toda a tabela de vínculos.
    await queryInterface.addIndex('product_categories', ['category_id'], {
      name: 'idx_product_categories_category_id'
    });

    // O preço também é usado no intervalo da busca de produtos.
    await queryInterface.addIndex('products', ['price'], {
      name: 'idx_products_price'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('products', 'idx_products_price');
    await queryInterface.removeIndex('product_categories', 'idx_product_categories_category_id');
  }
};
