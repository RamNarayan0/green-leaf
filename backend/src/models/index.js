/**
 * Models Index
 * 
 * Central export point for all Mongoose models
 */

const User = require('./User');
const Shop = require('./Shop');
const Product = require('./Product');
const Order = require('./Order');
const Vehicle = require('./Vehicle');
const DeliveryPartner = require('./DeliveryPartner');
const Category = require('./Category');

module.exports = {
  User,
  Shop,
  Product,
  Order,
  Vehicle,
  DeliveryPartner,
  Category
};
