const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const timestamps = { timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' };

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  firstname: { type: DataTypes.STRING(100), allowNull: false },
  surname: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false }
}, { ...timestamps, tableName: 'users' });

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, { ...timestamps, tableName: 'categories' });

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  stock: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: false },
  price_with_discount: { type: DataTypes.FLOAT, allowNull: false }
}, { ...timestamps, tableName: 'products' });

const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  path: { type: DataTypes.STRING(1000), allowNull: false }
}, { tableName: 'product_images', timestamps: false });

const ProductOption = sequelize.define('ProductOption', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title: { type: DataTypes.STRING(120), allowNull: false },
  shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
  radius: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  type: { type: DataTypes.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
  values: { type: DataTypes.STRING(1000), allowNull: false }
}, { tableName: 'product_options', timestamps: false });

const ProductCategory = sequelize.define('ProductCategory', {
  product_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, allowNull: false },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, allowNull: false }
}, { tableName: 'product_categories', timestamps: false });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });
Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', onDelete: 'CASCADE' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id' });
Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'product_id', otherKey: 'category_id', as: 'categories' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'category_id', otherKey: 'product_id', as: 'products' });

module.exports = { sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory };
