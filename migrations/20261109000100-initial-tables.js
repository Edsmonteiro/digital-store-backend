'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const id = () => ({ type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false });
    const stamp = () => ({ type: Sequelize.DATE, allowNull: false });
    await queryInterface.createTable('users', {
      id: id(), firstname: { type: Sequelize.STRING(100), allowNull: false },
      surname: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      created_at: stamp(), updated_at: stamp()
    });
    await queryInterface.createTable('categories', {
      id: id(), name: { type: Sequelize.STRING(120), allowNull: false },
      slug: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: stamp(), updated_at: stamp()
    });
    await queryInterface.createTable('products', {
      id: id(), enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      use_in_menu: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      stock: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      description: { type: Sequelize.TEXT, allowNull: true },
      price: { type: Sequelize.FLOAT, allowNull: false },
      price_with_discount: { type: Sequelize.FLOAT, allowNull: false },
      created_at: stamp(), updated_at: stamp()
    });
    await queryInterface.createTable('product_images', {
      id: id(), product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      path: { type: Sequelize.STRING(1000), allowNull: false }
    });
    await queryInterface.createTable('product_options', {
      id: id(), product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      title: { type: Sequelize.STRING(120), allowNull: false },
      shape: { type: Sequelize.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
      radius: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      type: { type: Sequelize.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
      values: { type: Sequelize.STRING(1000), allowNull: false }
    });
    await queryInterface.createTable('product_categories', {
      product_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, references: { model: 'products', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      category_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, references: { model: 'categories', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    });
    await queryInterface.addIndex('product_images', ['product_id']);
    await queryInterface.addIndex('product_options', ['product_id']);
    await queryInterface.addIndex('products', ['name']);
    await queryInterface.addIndex('categories', ['use_in_menu']);
  },
  async down(queryInterface) {
    for (const table of ['product_categories', 'product_options', 'product_images', 'products', 'categories', 'users']) {
      await queryInterface.dropTable(table);
    }
  }
};
