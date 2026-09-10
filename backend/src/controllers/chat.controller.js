/**
 * Chat Controller
 * Manages customer-delivery partner communication & AI Agent Suite
 */

const Message = require('../models/Message');
const Order = require('../models/Order');
const Product = require('../models/Product');
const socketService = require('../services/socket.service');

class ChatController {
  // Get messages for an order
  async getMessages(req, res, next) {
    try {
      const { orderId } = req.params;
      const messages = await Message.find({ order: orderId })
        .sort({ createdAt: 1 })
        .populate('sender', 'name avatar role');
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }

  // Send a message
  async sendMessage(req, res, next) {
    try {
      const { orderId } = req.params;
      const { content, recipientId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const message = await Message.create({
        order: orderId,
        sender: req.user.id,
        recipient: recipientId,
        content
      });

      const populatedMessage = await message.populate('sender', 'name avatar role');

      // Emit via socket for real-time delivery
      socketService.emitToUser(recipientId, 'new_message', {
        orderId,
        message: populatedMessage
      });

      res.status(201).json({
        success: true,
        data: populatedMessage
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark messages as read
  async markAsRead(req, res, next) {
    try {
      const { orderId } = req.params;
      await Message.updateMany(
        { order: orderId, recipient: req.user.id, isRead: false },
        { isRead: true }
      );
      
      res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      next(error);
    }
  }

  // AI Eco Assistant query handler
  async askAiAssistant(req, res, next) {
    try {
      const { message, role = 'customer' } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message content is required' });
      }

      const q = message.toLowerCase();
      let reply = '';
      let suggestions = [];
      let agentAction = null;

      if (role === 'shopkeeper') {
        if (q.includes('inventory') || q.includes('stock')) {
          reply = '📊 AI Inventory Agent: Based on recent eco-zone demand, organic fruits and plant-based milks have 35% higher reorder rates this week. Recommend restocking Organic Hass Avocados.';
          suggestions = ['Check top selling items', 'Low stock alerts', 'Eco packaging options'];
        } else {
          reply = '🏪 Shopkeeper AI Assistant: I can assist with automated demand forecasting, eco-friendly product listing optimization, and order fulfillment advice.';
          suggestions = ['Inventory forecast', 'View recent orders', 'Update eco tags'];
        }
      } else if (role === 'delivery') {
        if (q.includes('route') || q.includes('battery') || q.includes('ev')) {
          reply = '⚡ AI Route Agent: Your current EV Scooter battery is at 84%. Recommended route avoids 2 high-traffic junctions, saving 1.2km and 140g CO₂ emissions.';
          suggestions = ['Optimized navigation', 'Nearest EV charge station', 'Daily CO2 saved'];
        } else {
          reply = '🛵 Delivery Partner AI Assistant: I monitor live traffic telemetry, battery status, and eco-route efficiency for your delivery runs.';
          suggestions = ['Check active route', 'Battery telemetry', 'Today\'s earnings'];
        }
      } else {
        // Customer Role
        if (q.includes('recipe') || q.includes('salad') || q.includes('pasta') || q.includes('cook') || q.includes('dish')) {
          reply = '🥗 AI Recipe-to-Cart Agent: I can automatically find organic, plastic-free ingredients for your meal and add them directly to your green cart!';
          suggestions = ['Build Organic Green Salad', 'Build Low-Carbon Pasta', 'Build Eco Avocado Toast'];
          agentAction = { type: 'RECIPE_PROMPT', dish: q };
        } else if (q.includes('swap') || q.includes('alternative') || q.includes('plastic')) {
          reply = '🌱 AI Eco Swap Agent: Swapping standard bottled milk for Glass Bottle Organic Oat Milk saves 120g of plastic waste and reduces carbon impact by 45%.';
          suggestions = ['Show glass bottle dairy', 'Plastic-free snacks', 'Local organic produce'];
        } else if (q.includes('point') || q.includes('leaf') || q.includes('reward')) {
          reply = '🌿 Green Leaf Points are earned with every zero-emission order! You get 10 points for every ₹100 spent on eco-deliveries, plus 200 welcome bonus points.';
          suggestions = ['How to upgrade rank?', 'Buy GreenPass', 'Redeem points for trees'];
        } else if (q.includes('routing') || q.includes('route') || q.includes('traffic')) {
          reply = '🚴 Our AI Eco-Smart Routing calculates high-efficiency paths that avoid idling in congested zones, reducing vehicle CO₂ emissions by up to 18% per trip.';
          suggestions = ['Compare vehicles', 'Calculate carbon saved'];
        } else if (q.includes('carbon') || q.includes('co2') || q.includes('tree') || q.includes('impact')) {
          reply = '🌱 Choosing bicycles or electric scooters prevents ~75g of CO₂ per kilometer compared to petrol scooters. Saving 21kg of CO₂ equals 1 full tree planted!';
          suggestions = ['Check my rewards', 'Run AI Carbon Audit'];
          agentAction = { type: 'CARBON_AUDIT' };
        } else {
          reply = '🌱 Hello! I am your GreenLeaf Autonomous AI Agent. I can help you build recipe carts, suggest zero-plastic product swaps, conduct carbon audits, and track zero-emission deliveries!';
          suggestions = ['🥗 Recipe to Cart', '🔁 AI Eco Swap', '📊 Run Carbon Audit', '⚡ GreenPass Benefits'];
        }
      }

      res.json({
        success: true,
        data: {
          reply,
          suggestions,
          agentAction,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // AI Recipe to Cart endpoint
  async recipeToCart(req, res, next) {
    try {
      const { recipeName } = req.body;
      const query = (recipeName || 'organic salad').toLowerCase();

      let items = [];
      const dbProducts = await Product.find({ isActive: true }).limit(10);

      if (dbProducts && dbProducts.length > 0) {
        items = dbProducts.slice(0, 3).map(p => ({
          product: p._id,
          name: p.name,
          price: p.price,
          carbonSavings: p.carbonFootprint ? Math.round((0.5 - p.carbonFootprint) * 100) : 35,
          quantity: 1
        }));
      } else {
        items = [
          { name: 'Organic Hass Avocado', price: 120, carbonSavings: 45, quantity: 2 },
          { name: 'Fresh Organic Spinach (Plastic-Free)', price: 45, carbonSavings: 60, quantity: 1 },
          { name: 'Extra Virgin Olive Oil (Glass Bottle)', price: 450, carbonSavings: 30, quantity: 1 }
        ];
      }

      res.json({
        success: true,
        data: {
          recipe: recipeName || 'Eco-Friendly Meal',
          totalEstCarbonSavedGrams: 280,
          items,
          message: `AI Agent matched ${items.length} zero-emission ingredients for your recipe!`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // AI Carbon Audit endpoint
  async carbonAudit(req, res, next) {
    try {
      const { itemsCount = 3, transport = 'electric_scooter' } = req.body;
      
      const co2SavedKg = ((itemsCount * 0.45) + (transport === 'bicycle' ? 1.2 : 0.8)).toFixed(2);
      const treesEquivalent = (co2SavedKg / 2.1).toFixed(1);
      const ecoGrade = co2SavedKg > 3 ? 'A+' : co2SavedKg > 1.5 ? 'A' : 'B';

      res.json({
        success: true,
        data: {
          co2SavedKg: parseFloat(co2SavedKg),
          treesEquivalent: parseFloat(treesEquivalent),
          ecoGrade,
          tips: [
            'Selecting Bicycle delivery saves an additional 25g CO2 per km.',
            'Consolidating orders from single local shop reduces mileage by 40%.',
            'Buying glass-packaged dairy avoids single-use plastic waste.'
          ]
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();

