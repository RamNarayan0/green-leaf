/**
 * Database Seeder
 * Seeds the database with initial data including products, vehicles, and sample users
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Vehicle = require('../models/Vehicle');
const Category = require('../models/Category');
const logger = require('../utils/logger');

const connectDB = require('../config/database');

// Sample image URLs (using placeholder images for demo)
const getImageUrl = (name) => {
  const images = {
    // Fruits
    'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
    'orange': 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400',
    'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
    'grapes': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400',
    'watermelon': 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400',
    'pineapple': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400',
    'pomegranate': 'https://images.unsplash.com/photo-1541344999736-4a98982f342e?w=400',
    'papaya': 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400',
    'guava': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    
    // Vegetables
    'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82ber36?w=400',
    'tomato': 'https://images.unsplash.com/photo-1546470427-227c7369a9b5?w=400',
    'onion': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
    'cabbage': 'https://images.unsplash.com/photo-1594282486756-576b93e19e89?w=400',
    'cauliflower': 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400',
    'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    'broccoli': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
    'cucumber': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400',
    'brinjal': 'https://images.unsplash.com/photo-1528826007177-f38517ce9a76?w=400',
    
    // Dairy
    'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    'curd': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
    'paneer': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
    'butter': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
    'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400',
    'ghee': 'https://images.unsplash.com/photo-1600177897995-5f3a4cd8b3a5?w=400',
    'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    'cream': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
    
    // Grains & Pulses
    'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    'wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    'dal': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    'toor dal': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'moong dal': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'masoor dal': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    'urad dal': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'rajma': 'https://images.unsplash.com/photo-1515543904323-de27c9fa4f20?w=400',
    'chole': 'https://images.unsplash.com/photo-1515543904323-de27c9fa4f20?w=400',
    'chana': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    
    // Spices
    'turmeric': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    'red chili': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'coriander': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'cumin': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    'garlic': 'https://images.unsplash.com/photo-1580910051074-3eb6948863c5?w=400',
    'ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    'black pepper': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'cardamom': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'cinnamon': 'https://images.unsplash.com/photo-1515543904323-de27c9fa4f20?w=400',
    'cloves': 'https://images.unsplash.com/photo-1515543904323-de27c9fa4f20?w=400',
    
    // Staples
    'sugar': 'https://images.unsplash.com/photo-1583096907707-2b5d116d624c?w=400',
    'salt': 'https://images.unsplash.com/photo-1583096907707-2b5d116d624c?w=400',
    'oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    'mustard oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    'refined oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    'olive oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    'atta': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    'maida': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    'sooji': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    'rava': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
    
    // Snacks & Biscuits
    'biscuits': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400',
    'chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
    'noodles': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400',
    'pasta': 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400',
    'maggi': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400',
    'sauce': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400',
    'ketchup': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400',
    'jam': 'https://images.unsplash.com/photo-1589128777076-f639a841f9a3?w=400',
    'peanut butter': 'https://images.unsplash.com/photo-1589128777076-f639a841f9a3?w=400',
    'honey': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
    
    // Beverages
    'tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    'green tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    'juice': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
    'water': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
    'soda': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
    
    // Personal Care
    'soap': 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400',
    'shampoo': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    'toothpaste': 'https://images.unsplash.com/photo-1606851281224-2473a2a1c3e6?w=400',
    'toothbrush': 'https://images.unsplash.com/photo-1606851281224-2473a2a1c3e6?w=400',
    'face wash': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
    'cream': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
    'deodorant': 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400',
    'detergent': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
    
    // Household
    'dishwash': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
    'cleaner': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
    'mosquito repellent': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
    'room freshener': 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
    'batteries': 'https://images.unsplash.com/photo-1612735689369-4fe89db7114c?w=400',
    'bulb': 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400',
    
    // Eggs & Non-Veg
    'eggs': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
    'chicken': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
    'fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
    'mutton': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
  };
  
  return images[name.toLowerCase()] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
};

// Product categories with items
const productData = [
  // Fruits
  { name: 'Apple (1 kg)', category: 'Fruits', price: 180, image: 'apple', description: 'Fresh red apples from Himachal' },
  { name: 'Banana (1 dozen)', category: 'Fruits', price: 60, image: 'banana', description: 'Fresh yellow bananas' },
  { name: 'Orange (1 kg)', category: 'Fruits', price: 120, image: 'orange', description: 'Juicy oranges' },
  { name: 'Mango (1 kg)', category: 'Fruits', price: 150, image: 'mango', description: 'Sweet alphonso mangoes' },
  { name: 'Grapes (500g)', category: 'Fruits', price: 100, image: 'grapes', description: 'Seedless green grapes' },
  { name: 'Watermelon (1 piece)', category: 'Fruits', price: 50, image: 'watermelon', description: 'Fresh watermelon' },
  { name: 'Pineapple (1 piece)', category: 'Fruits', price: 80, image: 'pineapple', description: 'Fresh pineapple' },
  { name: 'Pomegranate (1 kg)', category: 'Fruits', price: 200, image: 'pomegranate', description: 'Fresh pomegranate' },
  { name: 'Papaya (1 piece)', category: 'Fruits', price: 60, image: 'papaya', description: 'Fresh papaya' },
  { name: 'Guava (500g)', category: 'Fruits', price: 40, image: 'guava', description: 'Fresh guava' },
  
  // Vegetables
  { name: 'Potato (1 kg)', category: 'Vegetables', price: 40, image: 'potato', description: 'Fresh potatoes' },
  { name: 'Tomato (1 kg)', category: 'Vegetables', price: 60, image: 'tomato', description: 'Fresh red tomatoes' },
  { name: 'Onion (1 kg)', category: 'Vegetables', price: 50, image: 'onion', description: 'Fresh onions' },
  { name: 'Carrot (500g)', category: 'Vegetables', price: 40, image: 'carrot', description: 'Fresh carrots' },
  { name: 'Cabbage (1 piece)', category: 'Vegetables', price: 35, image: 'cabbage', description: 'Fresh cabbage' },
  { name: 'Cauliflower (1 piece)', category: 'Vegetables', price: 45, image: 'cauliflower', description: 'Fresh cauliflower' },
  { name: 'Spinach (250g)', category: 'Vegetables', price: 25, image: 'spinach', description: 'Fresh spinach' },
  { name: 'Broccoli (1 piece)', category: 'Vegetables', price: 70, image: 'broccoli', description: 'Fresh broccoli' },
  { name: 'Cucumber (500g)', category: 'Vegetables', price: 30, image: 'cucumber', description: 'Fresh cucumber' },
  { name: 'Brinjal (500g)', category: 'Vegetables', price: 35, image: 'brinjal', description: 'Fresh brinjal' },
  
  // Dairy
  { name: 'Milk (1 litre)', category: 'Dairy', price: 60, image: 'milk', description: 'Fresh toned milk' },
  { name: 'Curd (500g)', category: 'Dairy', price: 40, image: 'curd', description: 'Fresh curd' },
  { name: 'Paneer (500g)', category: 'Dairy', price: 180, image: 'paneer', description: 'Fresh paneer' },
  { name: 'Butter (100g)', category: 'Dairy', price: 50, image: 'butter', description: 'Amul butter' },
  { name: 'Cheese (200g)', category: 'Dairy', price: 120, image: 'cheese', description: 'Amul cheese slices' },
  { name: 'Ghee (500ml)', category: 'Dairy', price: 350, image: 'ghee', description: 'Pure desi ghee' },
  { name: 'Yogurt (500g)', category: 'Dairy', price: 60, image: 'yogurt', description: 'Greek yogurt' },
  { name: 'Cream (200ml)', category: 'Dairy', price: 80, image: 'cream', description: 'Fresh cream' },
  
  // Pulses & Grains
  { name: 'Rice (1 kg)', category: 'Pulses & Grains', price: 80, image: 'rice', description: 'Basmati rice' },
  { name: 'Wheat (1 kg)', category: 'Pulses & Grains', price: 45, image: 'wheat', description: 'Whole wheat' },
  { name: 'Toor Dal (1 kg)', category: 'Pulses & Grains', price: 150, image: 'toor dal', description: 'Pure toor dal' },
  { name: 'Moong Dal (500g)', category: 'Pulses & Grains', price: 80, image: 'moong dal', description: 'Split moong dal' },
  { name: 'Masoor Dal (500g)', category: 'Pulses & Grains', price: 70, image: 'masoor dal', description: 'Red masoor dal' },
  { name: 'Urad Dal (500g)', category: 'Pulses & Grains', price: 90, image: 'urad dal', description: 'Split urad dal' },
  { name: 'Rajma (1 kg)', category: 'Pulses & Grains', price: 160, image: 'rajma', description: 'Kashmiri rajma' },
  { name: 'Chole (500g)', category: 'Pulses & Grains', price: 100, image: 'chole', description: 'Kabuli chana' },
  { name: 'Chana Dal (500g)', category: 'Pulses & Grains', price: 70, image: 'chana', description: 'Chana dal' },
  { name: 'Moong (1 kg)', category: 'Pulses & Grains', price: 120, image: 'moong dal', description: 'Whole green moong' },
  
  // Spices
  { name: 'Turmeric Powder (100g)', category: 'Spices', price: 35, image: 'turmeric', description: 'Pure turmeric powder' },
  { name: 'Red Chilli (100g)', category: 'Spices', price: 45, image: 'red chili', description: 'Kashmiri red chilli' },
  { name: 'Coriander Powder (100g)', category: 'Spices', price: 30, image: 'coriander', description: 'Fresh coriander powder' },
  { name: 'Cumin Seeds (100g)', category: 'Spices', price: 50, image: 'cumin', description: 'Jeera' },
  { name: 'Garlic (200g)', category: 'Spices', price: 40, image: 'garlic', description: 'Fresh garlic' },
  { name: 'Ginger (100g)', category: 'Spices', price: 35, image: 'ginger', description: 'Fresh ginger' },
  { name: 'Black Pepper (50g)', category: 'Spices', price: 60, image: 'black pepper', description: 'Whole black pepper' },
  { name: 'Cardamom (50g)', category: 'Spices', price: 80, image: 'cardamom', description: 'Green cardamom' },
  { name: 'Cinnamon (50g)', category: 'Spices', price: 40, image: 'cinnamon', description: 'Cinnamon sticks' },
  { name: 'Cloves (50g)', category: 'Spices', price: 45, image: 'cloves', description: 'Whole cloves' },
  
  // Staples
  { name: 'Sugar (1 kg)', category: 'Staples', price: 50, image: 'sugar', description: 'Refined sugar' },
  { name: 'Salt (1 kg)', category: 'Staples', price: 25, image: 'salt', description: 'Tata salt' },
  { name: 'Mustard Oil (1 litre)', category: 'Staples', price: 180, image: 'mustard oil', description: 'Pure mustard oil' },
  { name: 'Refined Oil (1 litre)', category: 'Staples', price: 160, image: 'refined oil', description: 'Refined sunflower oil' },
  { name: 'Olive Oil (500ml)', category: 'Staples', price: 350, image: 'olive oil', description: 'Extra virgin olive oil' },
  { name: 'Atta (1 kg)', category: 'Staples', price: 55, image: 'atta', description: 'Whole wheat atta' },
  { name: 'Maida (1 kg)', category: 'Staples', price: 45, image: 'maida', description: 'Fine maida' },
  { name: 'Sooji (500g)', category: 'Staples', price: 35, image: 'sooji', description: 'Rava/Sooji' },
  { name: 'Besan (500g)', category: 'Staples', price: 60, image: 'rava', description: 'Chickpea flour' },
  { name: 'Sugar Free (100g)', category: 'Staples', price: 45, image: 'sugar', description: 'Equal sugar substitute' },
  
  // Snacks
  { name: 'Biscuits (Parle-G)', category: 'Snacks', price: 30, image: 'biscuits', description: 'Parle-G biscuits' },
  { name: 'Chips (Lays)', category: 'Snacks', price: 20, image: 'chips', description: 'Lays chips' },
  { name: 'Noodles (Maggi)', category: 'Snacks', price: 25, image: 'maggi', description: 'Maggi 2-minute noodles' },
  { name: 'Pasta (Barilla)', category: 'Snacks', price: 120, image: 'pasta', description: 'Italian pasta' },
  { name: 'Tomato Ketchup (200g)', category: 'Snacks', price: 45, image: 'ketchup', description: 'Kissan ketchup' },
  { name: 'Jam (300g)', category: 'Snacks', price: 80, image: 'jam', description: 'Mixed fruit jam' },
  { name: 'Peanut Butter (400g)', category: 'Snacks', price: 180, image: 'peanut butter', description: 'Creamy peanut butter' },
  { name: 'Honey (500g)', category: 'Snacks', price: 250, image: 'honey', description: 'Pure honey' },
  { name: 'Oats (500g)', category: 'Snacks', price: 150, image: 'biscuits', description: 'Quaker oats' },
  { name: 'Cornflakes (300g)', category: 'Snacks', price: 80, image: 'chips', description: 'Kellogg cornflakes' },
  
  // Beverages
  { name: 'Tea (250g)', category: 'Beverages', price: 120, image: 'tea', description: 'Tata Tea' },
  { name: 'Coffee (200g)', category: 'Beverages', price: 180, image: 'coffee', description: 'Nescafe instant coffee' },
  { name: 'Green Tea (25 bags)', category: 'Beverages', price: 100, image: 'green tea', description: 'Tulsi green tea' },
  { name: 'Orange Juice (1 litre)', category: 'Beverages', price: 120, image: 'juice', description: 'Tropicana juice' },
  { name: 'Apple Juice (1 litre)', category: 'Beverages', price: 150, image: 'juice', description: 'Real apple juice' },
  { name: 'Water Bottle (1 litre)', category: 'Beverages', price: 20, image: 'water', description: 'Bisleri water' },
  
  // Personal Care
  { name: 'Soap (Lux)', category: 'Personal Care', price: 30, image: 'soap', description: 'Lux soap' },
  { name: 'Shampoo (Pantene)', category: 'Personal Care', price: 180, image: 'shampoo', description: 'Pantene shampoo' },
  { name: 'Toothpaste (Colgate)', category: 'Personal Care', price: 80, image: 'toothpaste', description: 'Colgate toothpaste' },
  { name: 'Toothbrush (Oral-B)', category: 'Personal Care', price: 60, image: 'toothbrush', description: 'Oral-B toothbrush' },
  { name: 'Face Wash (Himalaya)', category: 'Personal Care', price: 150, image: 'face wash', description: 'Himalaya face wash' },
  { name: 'Moisturizer (Nivea)', category: 'Personal Care', price: 200, image: 'cream', description: 'Nivea moisturizer' },
  { name: 'Deodorant (Nivea)', category: 'Personal Care', price: 250, image: 'deodorant', description: 'Nivea deodorant' },
  { name: 'Detergent (Tide)', category: 'Personal Care', price: 60, image: 'detergent', description: 'Tide detergent' },
  
  // Household
  { name: 'Dishwash (Vim)', category: 'Household', price: 35, image: 'dishwash', description: 'Vim dishwash bar' },
  { name: 'Floor Cleaner (Lizol)', category: 'Household', price: 150, image: 'cleaner', description: 'Lizol floor cleaner' },
  { name: 'Mosquito Repellent (Good Night)', category: 'Household', price: 80, image: 'mosquito repellent', description: 'Good Night liquid' },
  { name: 'Room Freshener (Glade)', category: 'Household', price: 120, image: 'room freshener', description: 'Glade air freshener' },
  { name: 'Batteries (Duracell)', category: 'Household', price: 150, image: 'batteries', description: 'Duracell AA batteries' },
  { name: 'LED Bulb (Philips)', category: 'Household', price: 120, image: 'bulb', description: 'Philips LED bulb' },
  { name: 'Match Box', category: 'Household', price: 10, image: 'cleaner', description: 'Safety match box' },
  { name: 'Plastic Bags', category: 'Household', price: 20, image: 'cleaner', description: 'Zip lock bags' },
  
  // Eggs & Non-Veg
  { name: 'Eggs (12 pieces)', category: 'Eggs & Non-Veg', price: 80, image: 'eggs', description: 'Farm fresh eggs' },
  { name: 'Chicken (1 kg)', category: 'Eggs & Non-Veg', price: 250, image: 'chicken', description: 'Fresh chicken' },
  { name: 'Fish (500g)', category: 'Eggs & Non-Veg', price: 350, image: 'fish', description: 'Fresh fish' },
];

// Categories
const categories = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', icon: '🥬', description: 'Fresh fruits and vegetables' },
  { name: 'Groceries', slug: 'groceries', icon: '🛒', description: 'Daily grocery essentials' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥛', description: 'Milk, cheese and eggs' },
  { name: 'Beverages', slug: 'beverages', icon: '🥤', description: 'Soft drinks, tea and coffee' },
  { name: 'Snacks', slug: 'snacks', icon: '🍿', description: 'Chips and biscuits' },
  { name: 'Meat & Fish', slug: 'meat-fish', icon: '🥩', description: 'Fresh meat and seafood' },
  { name: 'Bakery', slug: 'bakery', icon: '🍞', description: 'Bread and cakes' },
  { name: 'Household', slug: 'household', icon: '🧹', description: 'Cleaning supplies' },
  { name: 'Pulses & Grains', slug: 'pulses-grains', icon: '🌾', description: 'Lentils and grains' },
  { name: 'Spices', slug: 'spices', icon: '🌶️', description: 'Indian spices' },
  { name: 'Staples', slug: 'staples', icon: '🏠', description: 'Daily essentials' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', description: 'Personal hygiene' },
];

// Vehicle types reference (not stored in DB - just for reference)
const vehicleTypes = [
  { type: 'bicycle', name: 'Bicycle', emission_factor: 0, average_speed: 15, operating_cost_per_km: 0.5 },
  { type: 'electric_bicycle', name: 'Electric Bicycle', emission_factor: 5, average_speed: 20, operating_cost_per_km: 1.5 },
  { type: 'electric_scooter', name: 'Electric Scooter', emission_factor: 8, average_speed: 30, operating_cost_per_km: 2.5 },
];

// Sample Users
const users = [
  {
    name: 'Admin User',
    email: 'admin@greenroute.com',
    password: 'admin123',
    phone: '9999999999',
    role: 'admin',
    isVerified: true
  },
  {
    name: 'Test Customer',
    email: 'customer@greenroute.com',
    password: 'customer123',
    phone: '8888888888',
    role: 'customer',
    isVerified: true,
    addresses: [{
      label: 'Home',
      street: '123 Main Street',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      isDefault: true,
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716]
      }
    }]
  },
  {
    name: 'Test Shopkeeper',
    email: 'shop@greenroute.com',
    password: 'shop123',
    phone: '7777777777',
    role: 'shopkeeper',
    isVerified: true
  },
  {
    name: 'Test Delivery Partner',
    email: 'partner@greenroute.com',
    password: 'partner123',
    phone: '6666666666',
    role: 'delivery_partner',
    isVerified: true,
    vehicle: {
      type: 'electric_bicycle',
      licenseNumber: 'KA01AB1234',
      vehicleNumber: 'KA01AB1234',
      isVerified: true
    }
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Product.deleteMany({});
    await Vehicle.deleteMany({});
    await Category.deleteMany({});
    logger.info('Cleared existing data');

    // Seed Categories
    const categoryDocs = await Category.insertMany(categories);
    logger.info(`Seeded ${categoryDocs.length} categories`);

    // Note: Vehicles are managed through the Vehicle model static methods
    // Vehicle types are defined in the model, not seeded in DB
    logger.info('Vehicle types available via Vehicle.getAllVehicleTypes()');

    // Seed Users - Use .create to trigger password hashing middleware
    const userDocs = await User.create(users);
    logger.info(`Seeded ${userDocs.length} users`);

    // Find shopkeeper user
    const shopkeeper = userDocs.find(u => u.role === 'shopkeeper');

    // Create multiple sample shops with different locations
    const shops = [
      {
        name: 'GreenRoute Fresh Store',
        owner: shopkeeper._id,
        address: {
          street: '456 Market Road',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560002'
        },
        location: {
          type: 'Point',
          coordinates: [77.5920, 12.9750] // Bangalore central
        },
        phone: '9876543210',
        email: 'store@greenroute.com',
        isOpen: true,
        rating: 4.5,
        totalRatings: 100,
        categories: categoryDocs.map(c => c._id),
        freeDelivery: true,
        minOrderAmount: 100,
        deliveryTime: 30,
        isEcoFriendly: true,
        hasEcoPackaging: true
      },
      {
        name: 'GreenRoute Koramangala',
        owner: shopkeeper._id,
        address: {
          street: '100 Outer Ring Road',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560034'
        },
        location: {
          type: 'Point',
          coordinates: [77.6247, 12.9352] // Koramangala
        },
        phone: '9876543211',
        email: 'koramangala@greenroute.com',
        isOpen: true,
        rating: 4.7,
        totalRatings: 150,
        categories: categoryDocs.map(c => c._id),
        freeDelivery: true,
        minOrderAmount: 150,
        deliveryTime: 25
      },
      {
        name: 'GreenRoute Whitefield',
        owner: shopkeeper._id,
        address: {
          street: '200 ITPL Road',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560066'
        },
        location: {
          type: 'Point',
          coordinates: [77.7500, 12.9698] // Whitefield
        },
        phone: '9876543212',
        email: 'whitefield@greenroute.com',
        isOpen: true,
        rating: 4.3,
        totalRatings: 80,
        categories: categoryDocs.map(c => c._id),
        freeDelivery: true,
        minOrderAmount: 200,
        deliveryTime: 35
      },
      {
        name: 'GreenRoute Indiranagar',
        owner: shopkeeper._id,
        address: {
          street: '50 CMH Road',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560038'
        },
        location: {
          type: 'Point',
          coordinates: [77.6408, 12.9784] // Indiranagar
        },
        phone: '9876543213',
        email: 'indiranagar@greenroute.com',
        isOpen: true,
        rating: 4.6,
        totalRatings: 120,
        categories: categoryDocs.map(c => c._id),
        freeDelivery: true,
        minOrderAmount: 100,
        deliveryTime: 20
      }
    ];

    const shopDocs = await Shop.insertMany(shops);
    logger.info(`Created ${shopDocs.length} sample shops`);

    // Update shopkeeper with first shop ID
    await User.findByIdAndUpdate(shopkeeper._id, { shopId: shopDocs[0]._id });

    // Seed Products - assign to first shop
    const productDocs = [];
    for (const p of productData) {
      // Mapping for consolidated categories
      let lookupName = p.category.toUpperCase();
      if (lookupName === 'FRUITS' || lookupName === 'VEGETABLES') {
        lookupName = 'FRUITS & VEGETABLES';
      } else if (lookupName === 'DAIRY') {
        lookupName = 'DAIRY & EGGS';
      } else if (lookupName === 'SNACKS & BISCUITS') {
        lookupName = 'SNACKS';
      }

      // Find the corresponding category Doc
      const categoryDoc = categoryDocs.find(c => c.name.toUpperCase() === lookupName);
      
      const product = {
        name: p.name,
        description: p.description,
        price: p.price,
        comparePrice: p.price * 1.2,
        category: categoryDoc ? categoryDoc._id : categoryDocs[0]._id, 
        shop: shopDocs[0]._id,
        primaryImage: getImageUrl(p.image),
        stockQuantity: Math.floor(Math.random() * 100) + 20,
        isAvailable: true,
        featured: Math.random() > 0.7,
        discountPercentage: Math.floor(Math.random() * 15),
        unit: p.name.includes('1 kg') ? 'kg' : p.name.includes('500g') ? 'g' : p.name.includes('250g') ? 'g' : p.name.includes('litre') ? 'liter' : 'piece',
        brand: 'GreenRoute'
      };
      productDocs.push(product);
    }

    const products = await Product.insertMany(productDocs);
    logger.info(`Seeded ${products.length} products`);

    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
