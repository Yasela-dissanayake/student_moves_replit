import { Router } from 'express';
import { z } from 'zod';
import { IStorage } from './storage';
import { 
  insertMarketplaceItemSchema, 
  insertMarketplaceOfferSchema, 
  insertMarketplaceTransactionSchema,
  insertTransactionMessageSchema,
  insertSavedMarketplaceItemSchema,
  insertReportedMarketplaceItemSchema,
  MarketplaceItemCategories,
  MarketplaceItemConditions,
  TransactionStatuses,
  PaymentStatuses,
  DeliveryStatuses,
  DeliveryMethods,
  PaymentMethods,
  OfferStatuses
} from '../shared/marketplace-schema';
import multer from 'multer';
import { createId } from '@paralleldrive/cuid2';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'marketplace');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueId = createId();
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uniqueId}${fileExtension}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Function to calculate distance between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Mock user data for development purposes
const MOCK_USER = {
  id: 4, // Using a valid user ID from our database (Test Tenant)
  name: "Test Tenant",
  email: "tenant@unirent.com"
};

const router = Router();

export default function configureMarketplaceRoutes(storage: IStorage) {
  // GET all marketplace items
  router.get('/items', async (req, res) => {
    try {
      console.log('Fetching marketplace items...');
      console.log('Storage object:', Object.keys(storage));
      
      // Check if the storage has the required method
      if (!storage.getAllMarketplaceItems) {
        console.error('Error: getAllMarketplaceItems method not found in storage');
        return res.status(500).json({ 
          success: false, 
          message: 'Storage interface missing required marketplace methods' 
        });
      }
      
      // Additional check for getMarketplaceItem method as it's needed for item detail pages
      if (!storage.getMarketplaceItem) {
        console.error('Error: getMarketplaceItem method not found in storage');
        return res.status(500).json({ 
          success: false, 
          message: 'Storage interface missing required getMarketplaceItem method' 
        });
      }
      
      const category = req.query.category as string;
      const condition = req.query.condition as string;
      const minPrice = req.query.minPrice as string;
      const maxPrice = req.query.maxPrice as string;
      const location = req.query.location as string;
      const sortBy = req.query.sortBy as 'latest' | 'price_low' | 'price_high' | 'popular';
      const searchQuery = req.query.search as string;
      
      // Get all items
      const items = await storage.getAllMarketplaceItems();
      
      // Filter based on query parameters
      let filteredItems = [...items];

      if (category) {
        filteredItems = filteredItems.filter(item => item.category === category);
      }
      
      if (condition) {
        filteredItems = filteredItems.filter(item => item.condition === condition);
      }
      
      if (minPrice) {
        filteredItems = filteredItems.filter(item => parseFloat(item.price) >= parseFloat(minPrice));
      }
      
      if (maxPrice) {
        filteredItems = filteredItems.filter(item => parseFloat(item.price) <= parseFloat(maxPrice));
      }
      
      if (location) {
        filteredItems = filteredItems.filter(item => item.location.toLowerCase().includes(location.toLowerCase()));
      }
      
      if (searchQuery) {
        filteredItems = filteredItems.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
        );
      }
      
      // Sort items
      switch (sortBy) {
        case 'latest':
          filteredItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'price_low':
          filteredItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price_high':
          filteredItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'popular':
          filteredItems.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
          break;
        default:
          // Default sort by latest
          filteredItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      // Check if items are saved by current user
      const savedItems = await storage.getSavedMarketplaceItemsByUser(MOCK_USER.id);
      const savedItemIds = savedItems.map(item => item.itemId);
      
      // Add saved info to each item
      const itemsWithSavedInfo = filteredItems.map(item => ({
        ...item,
        savedByCurrentUser: savedItemIds.includes(item.id)
      }));
      
      res.json({ success: true, items: itemsWithSavedInfo });
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch marketplace items' });
    }
  });
  
  // GET a single marketplace item
  router.get("/items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      console.log('======================================');
      console.log('Server - Fetching marketplace item with ID:', itemId);
      console.log('Storage object keys:', Object.keys(storage));
      
      // Check if the storage has the required method
      if (!storage.getMarketplaceItem) {
        console.error('Error: getMarketplaceItem method not found in storage');
        return res.status(500).json({ 
          success: false, 
          message: 'Storage interface missing required marketplace methods' 
        });
      }
      
      console.log('About to call storage.getMarketplaceItem with ID:', itemId);
      const item = await storage.getMarketplaceItem(itemId);
      console.log('Server - getMarketplaceItem result:', item ? 'Found item' : 'Item not found');
      
      if (!item) {
        console.error('Item not found with ID:', itemId);
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      console.log('Item found:', item.id, item.title);
      
      // Increment view count
      await storage.updateMarketplaceItem(itemId, { viewCount: (item.viewCount || 0) + 1 });
      
      // Check if item is saved by current user
      const savedItems = await storage.getSavedMarketplaceItemsByUser(MOCK_USER.id);
      const savedItemIds = savedItems.map(item => item.itemId);
      
      // Get seller info
      const seller = await storage.getUserById(item.userId);
      const sellerName = seller ? seller.name : 'Unknown Seller';
      const sellerJoinDate = seller ? seller.createdAt : new Date();
      
      // Get similar items (same category, different seller)
      const allItems = await storage.getAllMarketplaceItems();
      const similarItems = allItems
        .filter(i => 
          i.id !== itemId && 
          i.category === item.category && 
          i.userId !== item.userId &&
          i.listingStatus === 'active'
        )
        .slice(0, 4)
        .map(i => ({
          id: i.id,
          title: i.title,
          price: i.price,
          images: i.images,
          location: i.location
        }));
      
      res.json({ 
        success: true, 
        item: {
          ...item, 
          savedByCurrentUser: savedItemIds.includes(itemId),
          sellerName,
          sellerJoinDate
        },
        similarItems
      });
    } catch (error) {
      console.error('Error fetching marketplace item:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch marketplace item' });
    }
  });
  
  // POST create a new marketplace item
  router.post("/items", upload.array('images', 5), async (req, res) => {
    try {
      console.log('======================================');
      console.log('Creating a new marketplace item');
      console.log('Request body:', req.body);
      console.log('Files received:', req.files ? (Array.isArray(req.files) ? req.files.length : 'not an array') : 'no files');
      
      if (!req.body || !req.body.data) {
        console.error('Missing required data in request body');
        return res.status(400).json({ success: false, message: 'Missing required data in request body' });
      }
      
      // Parse the text fields
      let data;
      try {
        data = JSON.parse(req.body.data);
        console.log('Parsed data:', data);
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
        return res.status(400).json({ success: false, message: 'Invalid JSON data format' });
      }
      
      // Validate the input
      try {
        const validatedData = insertMarketplaceItemSchema.parse({
          ...data,
          userId: MOCK_USER.id, // Use the mock user ID
          sellerId: MOCK_USER.id, // Also set sellerId for consistency
          images: [], // We'll add the images later
          tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
        });
        
        console.log('Validated data:', validatedData);
        
        // Process uploaded images
        if (req.files && Array.isArray(req.files)) {
          const uploadedFiles = req.files as Express.Multer.File[];
          console.log('Processing files:', uploadedFiles.map(f => f.originalname));
          
          // Ensure uploads directory exists
          const uploadDir = path.join(process.cwd(), 'uploads', 'marketplace');
          if (!fs.existsSync(uploadDir)) {
            console.log('Creating upload directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Generate image URLs
          const imageUrls = uploadedFiles.map(file => {
            // For debugging, verify file existence
            const filePath = path.join(process.cwd(), 'uploads', 'marketplace', file.filename);
            const fileExists = fs.existsSync(filePath);
            console.log(`File ${file.filename} exists: ${fileExists}`);
            
            return `/uploads/marketplace/${file.filename}`;
          });
          
          console.log('Image URLs:', imageUrls);
          validatedData.images = imageUrls;
        } else {
          console.log('No files to process');
        }
        
        // Create the item
        console.log('Creating marketplace item with data:', validatedData);
        const newItem = await storage.createMarketplaceItem(validatedData);
        console.log('New item created:', newItem);
        
        res.status(201).json({ 
          success: true, 
          item: newItem,
          itemId: newItem.id // Include itemId explicitly for client redirection
        });
      } catch (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error', 
          error: validationError instanceof Error ? validationError.message : String(validationError) 
        });
      }
    } catch (error) {
      console.error('Error creating marketplace item:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create marketplace item',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    console.log('======================================');
  });
  
  // PUT update a marketplace item
  router.put("/items/:id", upload.array('images', 5), async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getMarketplaceItem(itemId);
      
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      // Check if the user is the owner
      if (item.userId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this item' });
      }
      
      // Parse the text fields
      const data = JSON.parse(req.body.data);
      
      // Prepare the update data
      const updateData: any = {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition,
        location: data.location,
        meetInPerson: data.meetInPerson,
        canDeliver: data.canDeliver,
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : item.tags,
        updatedAt: new Date()
      };
      
      // Process uploaded images
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploadedFiles = req.files as Express.Multer.File[];
        const newImageUrls = uploadedFiles.map(file => `/uploads/marketplace/${file.filename}`);
        
        // If keepExistingImages is true, keep the existing images and add new ones
        if (data.keepExistingImages) {
          updateData.images = [...item.images, ...newImageUrls];
        } else {
          updateData.images = newImageUrls;
        }
      }
      
      // Update the item
      const updatedItem = await storage.updateMarketplaceItem(itemId, updateData);
      
      res.json({ success: true, item: updatedItem });
    } catch (error) {
      console.error('Error updating marketplace item:', error);
      res.status(500).json({ success: false, message: 'Failed to update marketplace item' });
    }
  });
  
  // DELETE a marketplace item
  router.delete("/items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getMarketplaceItem(itemId);
      
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      // Check if the user is the owner
      if (item.userId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
      }
      
      // Delete the item
      await storage.deleteMarketplaceItem(itemId);
      
      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting marketplace item:', error);
      res.status(500).json({ success: false, message: 'Failed to delete marketplace item' });
    }
  });
  
  // POST buy an item directly
  router.post("/items/:id/buy", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getMarketplaceItem(itemId);
      
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      // Check if the item is not already sold
      if (item.listingStatus !== 'active') {
        return res.status(400).json({ success: false, message: 'Item is not available for purchase' });
      }
      
      // Check if the user is not buying their own item
      if (item.userId === MOCK_USER.id) {
        return res.status(400).json({ success: false, message: 'You cannot buy your own item' });
      }
      
      // Get data from request
      const { deliveryMethod, deliveryAddress } = req.body;
      
      // Validate delivery method
      if (!DeliveryMethods.includes(deliveryMethod)) {
        return res.status(400).json({ success: false, message: 'Invalid delivery method' });
      }
      
      // If delivery method is delivery, check if address is provided
      if (deliveryMethod === 'delivery' && !deliveryAddress) {
        return res.status(400).json({ success: false, message: 'Delivery address is required for delivery method' });
      }
      
      // Create a transaction
      const transaction = await storage.createMarketplaceTransaction({
        itemId,
        buyerId: MOCK_USER.id,
        sellerId: item.userId,
        status: 'pending',
        paymentStatus: 'pending',
        deliveryMethod,
        deliveryAddress: deliveryAddress || null,
        amount: item.price
      });
      
      // Update item status to sold
      await storage.updateMarketplaceItem(itemId, { 
        listingStatus: 'sold',
        updatedAt: new Date()
      });
      
      // Add a system message to the transaction
      await storage.createTransactionMessage({
        transactionId: transaction.id,
        senderId: 0, // System
        senderType: 'system',
        message: 'Transaction created. Awaiting payment confirmation.'
      });
      
      res.status(201).json({ success: true, transaction });
    } catch (error) {
      console.error('Error buying marketplace item:', error);
      res.status(500).json({ success: false, message: 'Failed to buy marketplace item' });
    }
  });
  
  // POST make an offer on an item
  router.post("/items/:id/offer", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getMarketplaceItem(itemId);
      
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      // Check if the item is not already sold
      if (item.listingStatus !== 'active') {
        return res.status(400).json({ success: false, message: 'Item is not available for offers' });
      }
      
      // Check if the user is not making an offer on their own item
      if (item.userId === MOCK_USER.id) {
        return res.status(400).json({ success: false, message: 'You cannot make an offer on your own item' });
      }
      
      // Get data from request
      const { amount, note } = req.body;
      
      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid offer amount' });
      }
      
      // Check if user already has a pending offer on this item
      const existingOffers = await storage.getMarketplaceOffersByBuyerAndItem(MOCK_USER.id, itemId);
      const pendingOffer = existingOffers.find(offer => offer.status === 'pending');
      
      if (pendingOffer) {
        return res.status(400).json({ success: false, message: 'You already have a pending offer on this item' });
      }
      
      // Create offer
      const offer = await storage.createMarketplaceOffer({
        itemId,
        buyerId: MOCK_USER.id,
        sellerId: item.userId,
        amount,
        note: note || null,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
      });
      
      res.status(201).json({ success: true, offer });
    } catch (error) {
      console.error('Error making offer:', error);
      res.status(500).json({ success: false, message: 'Failed to make offer' });
    }
  });
  
  // POST respond to an offer
  router.post("/offers/:id/respond", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getMarketplaceOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }
      
      // Check if the user is the seller
      if (offer.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to respond to this offer' });
      }
      
      // Check if the offer is pending
      if (offer.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Offer is no longer pending' });
      }
      
      // Get the action from request
      const { action } = req.body;
      
      if (action !== 'accept' && action !== 'reject') {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }
      
      if (action === 'accept') {
        // Get the item
        const item = await storage.getMarketplaceItem(offer.itemId);
        
        if (!item) {
          return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        // Check if the item is still active
        if (item.listingStatus !== 'active') {
          return res.status(400).json({ success: false, message: 'Item is no longer available' });
        }
        
        // Create a transaction
        const transaction = await storage.createMarketplaceTransaction({
          itemId: offer.itemId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          status: 'pending',
          paymentStatus: 'pending',
          deliveryMethod: 'pickup', // Default to pickup, can be updated later
          amount: offer.amount
        });
        
        // Update offer status
        await storage.updateMarketplaceOffer(offerId, { 
          status: 'accepted',
          updatedAt: new Date()
        });
        
        // Update item status
        await storage.updateMarketplaceItem(offer.itemId, { 
          listingStatus: 'sold',
          updatedAt: new Date()
        });
        
        // Cancel all other offers on this item
        const otherOffers = await storage.getMarketplaceOffersByItem(offer.itemId);
        for (const otherOffer of otherOffers) {
          if (otherOffer.id !== offerId && otherOffer.status === 'pending') {
            await storage.updateMarketplaceOffer(otherOffer.id, { 
              status: 'cancelled',
              updatedAt: new Date()
            });
          }
        }
        
        // Add a system message to the transaction
        await storage.createTransactionMessage({
          transactionId: transaction.id,
          senderId: 0, // System
          senderType: 'system',
          message: 'Offer accepted. Transaction created. Awaiting payment confirmation.'
        });
        
        res.json({ success: true, message: 'Offer accepted', transactionId: transaction.id });
      } else {
        // Reject the offer
        await storage.updateMarketplaceOffer(offerId, { 
          status: 'rejected',
          updatedAt: new Date()
        });
        
        res.json({ success: true, message: 'Offer rejected' });
      }
    } catch (error) {
      console.error('Error responding to offer:', error);
      res.status(500).json({ success: false, message: 'Failed to respond to offer' });
    }
  });
  
  // POST cancel an offer
  router.post("/offers/:id/cancel", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getMarketplaceOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }
      
      // Check if the user is the buyer
      if (offer.buyerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this offer' });
      }
      
      // Check if the offer is pending
      if (offer.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Offer is no longer pending' });
      }
      
      // Cancel the offer
      await storage.updateMarketplaceOffer(offerId, { 
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      res.json({ success: true, message: 'Offer cancelled' });
    } catch (error) {
      console.error('Error cancelling offer:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel offer' });
    }
  });
  
  // GET all transactions for the current user
  router.get("/transactions", async (req, res) => {
    try {
      // Get transactions where user is either buyer or seller
      const transactions = await storage.getMarketplaceTransactionsByUser(MOCK_USER.id);
      
      // Enhance transactions with item and user details
      const enhancedTransactions = await Promise.all(transactions.map(async (transaction) => {
        const item = await storage.getMarketplaceItem(transaction.itemId);
        const buyer = await storage.getUserById(transaction.buyerId);
        const seller = await storage.getUserById(transaction.sellerId);
        
        return {
          ...transaction,
          item: item ? {
            id: item.id,
            title: item.title,
            description: item.description,
            price: item.price,
            images: item.images,
            category: item.category,
            condition: item.condition
          } : null,
          buyerName: buyer ? buyer.name : 'Unknown Buyer',
          sellerName: seller ? seller.name : 'Unknown Seller'
        };
      }));
      
      res.json({ success: true, transactions: enhancedTransactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
  });
  
  // GET a single transaction
  router.get("/transactions/:id", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is involved in this transaction
      if (transaction.buyerId !== MOCK_USER.id && transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this transaction' });
      }
      
      // Get associated item
      const item = await storage.getMarketplaceItem(transaction.itemId);
      
      // Get buyer and seller info
      const buyer = await storage.getUserById(transaction.buyerId);
      const seller = await storage.getUserById(transaction.sellerId);
      
      // Get messages
      const messages = await storage.getTransactionMessagesByTransaction(transactionId);
      
      // Return enhanced transaction
      const enhancedTransaction = {
        ...transaction,
        item: item ? {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          images: item.images,
          category: item.category,
          condition: item.condition
        } : null,
        buyerName: buyer ? buyer.name : 'Unknown Buyer',
        sellerName: seller ? seller.name : 'Unknown Seller',
        messages
      };
      
      res.json({ success: true, transaction: enhancedTransaction });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch transaction' });
    }
  });
  
  // POST send a message in a transaction
  router.post("/transactions/:id/messages", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is involved in this transaction
      if (transaction.buyerId !== MOCK_USER.id && transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to send messages in this transaction' });
      }
      
      // Get message text
      const { message } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message text is required' });
      }
      
      // Determine if the current user is the buyer or seller
      const senderType = transaction.buyerId === MOCK_USER.id ? 'buyer' : 'seller';
      
      // Add the message
      const newMessage = await storage.createTransactionMessage({
        transactionId,
        senderId: MOCK_USER.id,
        senderType,
        message: message.trim()
      });
      
      res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  });
  
  // POST update payment status (e.g., upload receipt)
  router.post("/transactions/:id/receipt", upload.single('receipt'), async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is the buyer
      if (transaction.buyerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to upload receipt for this transaction' });
      }
      
      // Check if transaction status is pending
      if (transaction.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Transaction is not in pending status' });
      }
      
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Receipt file is required' });
      }
      
      // Get the receipt file path
      const receiptUrl = `/uploads/marketplace/${req.file.filename}`;
      
      // Update transaction
      await storage.updateMarketplaceTransaction(transactionId, {
        paymentStatus: 'processing',
        paymentReceipt: receiptUrl,
        status: 'paid',
        updatedAt: new Date()
      });
      
      // Add a system message
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: 'Payment receipt uploaded. Awaiting seller confirmation.'
      });
      
      res.json({ success: true, message: 'Receipt uploaded successfully' });
    } catch (error) {
      console.error('Error uploading receipt:', error);
      res.status(500).json({ success: false, message: 'Failed to upload receipt' });
    }
  });
  
  // POST update delivery address
  router.post("/transactions/:id/address", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is the buyer
      if (transaction.buyerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update address for this transaction' });
      }
      
      // Get address
      const { address } = req.body;
      
      if (!address || !address.trim()) {
        return res.status(400).json({ success: false, message: 'Address is required' });
      }
      
      // Update transaction
      await storage.updateMarketplaceTransaction(transactionId, {
        deliveryAddress: address.trim(),
        updatedAt: new Date()
      });
      
      // Add a system message
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: 'Delivery address updated.'
      });
      
      res.json({ success: true, message: 'Address updated successfully' });
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ success: false, message: 'Failed to update address' });
    }
  });
  
  // POST update tracking information
  router.post("/transactions/:id/tracking", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is the seller
      if (transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update tracking info for this transaction' });
      }
      
      // Check if transaction status is paid
      if (transaction.status !== 'paid') {
        return res.status(400).json({ success: false, message: 'Transaction must be in paid status to update tracking' });
      }
      
      // Get tracking number
      const { trackingNumber } = req.body;
      
      if (!trackingNumber || !trackingNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Tracking number is required' });
      }
      
      // Update transaction
      await storage.updateMarketplaceTransaction(transactionId, {
        deliveryTrackingNumber: trackingNumber.trim(),
        deliveryStatus: 'in_transit',
        status: 'shipped',
        updatedAt: new Date()
      });
      
      // Add a system message
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: `Item shipped. Tracking number: ${trackingNumber.trim()}`
      });
      
      res.json({ success: true, message: 'Tracking information updated successfully' });
    } catch (error) {
      console.error('Error updating tracking info:', error);
      res.status(500).json({ success: false, message: 'Failed to update tracking information' });
    }
  });
  
  // POST update delivery status
  router.post("/transactions/:id/delivery-status", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is the seller
      if (transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update delivery status for this transaction' });
      }
      
      // Get status
      const { status } = req.body;
      
      if (!status || !DeliveryStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Valid delivery status is required' });
      }
      
      // Update transaction delivery status
      await storage.updateMarketplaceTransaction(transactionId, {
        deliveryStatus: status,
        updatedAt: new Date()
      });
      
      // If status is delivered, also update transaction status
      if (status === 'delivered') {
        await storage.updateMarketplaceTransaction(transactionId, {
          status: 'delivered',
          updatedAt: new Date()
        });
        
        // Set a timeout to auto-complete the transaction after 3 days
        // In a real application, this would be handled by a background job
        setTimeout(async () => {
          const updatedTransaction = await storage.getMarketplaceTransaction(transactionId);
          if (updatedTransaction && updatedTransaction.status === 'delivered') {
            await storage.updateMarketplaceTransaction(transactionId, {
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date()
            });
            
            await storage.createTransactionMessage({
              transactionId,
              senderId: 0, // System
              senderType: 'system',
              message: 'Transaction automatically completed.'
            });
          }
        }, 3 * 24 * 60 * 60 * 1000); // 3 days
      }
      
      // Add a system message
      const statusMessages = {
        'pending': 'Delivery status updated: Pending',
        'ready_for_pickup': 'Item is ready for pickup.',
        'in_transit': 'Item is in transit.',
        'delivered': 'Item has been delivered. Transaction will be automatically completed in 3 days if no issues are reported.',
        'failed': 'Delivery attempt failed. Please contact the seller.'
      };
      
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: statusMessages[status] || `Delivery status updated: ${status}`
      });
      
      res.json({ success: true, message: 'Delivery status updated successfully' });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ success: false, message: 'Failed to update delivery status' });
    }
  });
  
  // POST upload delivery proof for a transaction
  router.post("/transactions/:id/delivery-proof", upload.single('proof'), async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is the seller
      if (transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to upload delivery proof for this transaction' });
      }
      
      // Check if transaction status allows delivery proof
      if (transaction.status !== 'paid' && transaction.status !== 'shipped') {
        return res.status(400).json({ success: false, message: 'Transaction must be in paid or shipped status to upload delivery proof' });
      }
      
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Proof image is required' });
      }
      
      // Get the file path
      const proofUrl = `/uploads/marketplace/${req.file.filename}`;
      
      // Update transaction with delivery proof
      const updatedTransaction = await storage.uploadDeliveryProof(transactionId, proofUrl);
      
      // Add a system message to the transaction
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: 'Seller has uploaded proof of delivery.'
      });
      
      res.json({ success: true, transaction: updatedTransaction });
    } catch (error) {
      console.error('Error uploading delivery proof:', error);
      res.status(500).json({ success: false, message: 'Failed to upload delivery proof' });
    }
  });
  
  // DELETE delivery proof image
  router.delete("/transactions/:id/delivery-proof", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Image URL is required' });
      }
      
      // Get transaction
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if user is the seller
      if (transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete delivery proof for this transaction' });
      }
      
      // Check if transaction has the image
      if (!transaction.deliveryProofImages.includes(imageUrl)) {
        return res.status(404).json({ success: false, message: 'Image not found in delivery proof images' });
      }
      
      // Update transaction by removing the delivery proof image
      const updatedTransaction = await storage.deleteDeliveryProof(transactionId, imageUrl);
      
      // Add a system message to the transaction
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: 'Seller has removed a delivery proof image.'
      });
      
      res.json({ success: true, transaction: updatedTransaction });
    } catch (error) {
      console.error('Error deleting delivery proof:', error);
      res.status(500).json({ success: false, message: 'Failed to delete delivery proof' });
    }
  });
  
  // POST report a problem with a transaction
  router.post("/transactions/:id/problem", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is involved in this transaction
      if (transaction.buyerId !== MOCK_USER.id && transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to report problems with this transaction' });
      }
      
      // Get description
      const { description } = req.body;
      
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, message: 'Problem description is required' });
      }
      
      // Determine if the current user is the buyer or seller
      const senderType = transaction.buyerId === MOCK_USER.id ? 'buyer' : 'seller';
      
      // If transaction is in delivered status, change it to disputed
      if (transaction.status === 'delivered') {
        await storage.updateMarketplaceTransaction(transactionId, {
          status: 'disputed',
          updatedAt: new Date()
        });
      }
      
      // Add a system message
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: `A problem has been reported by the ${senderType}.`
      });
      
      // Add user message with the problem description
      await storage.createTransactionMessage({
        transactionId,
        senderId: MOCK_USER.id,
        senderType,
        message: description.trim()
      });
      
      res.json({ success: true, message: 'Problem reported successfully' });
    } catch (error) {
      console.error('Error reporting problem:', error);
      res.status(500).json({ success: false, message: 'Failed to report problem' });
    }
  });
  
  // POST cancel a transaction
  router.post("/transactions/:id/cancel", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getMarketplaceTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      
      // Check if the user is involved in this transaction
      if (transaction.buyerId !== MOCK_USER.id && transaction.sellerId !== MOCK_USER.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this transaction' });
      }
      
      // Check if transaction can be cancelled
      if (['completed', 'cancelled', 'refunded'].includes(transaction.status)) {
        return res.status(400).json({ success: false, message: 'Transaction cannot be cancelled in its current state' });
      }
      
      // Get reason
      const { reason } = req.body;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
      }
      
      // Determine if the current user is the buyer or seller
      const senderType = transaction.buyerId === MOCK_USER.id ? 'buyer' : 'seller';
      
      // Update transaction
      await storage.updateMarketplaceTransaction(transactionId, {
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      // If there's an associated item, set it back to active
      const item = await storage.getMarketplaceItem(transaction.itemId);
      if (item && item.listingStatus === 'sold') {
        await storage.updateMarketplaceItem(transaction.itemId, {
          listingStatus: 'active',
          updatedAt: new Date()
        });
      }
      
      // Add a system message
      await storage.createTransactionMessage({
        transactionId,
        senderId: 0, // System
        senderType: 'system',
        message: `Transaction cancelled by the ${senderType}.`
      });
      
      // Add user message with the cancellation reason
      await storage.createTransactionMessage({
        transactionId,
        senderId: MOCK_USER.id,
        senderType,
        message: `Cancellation reason: ${reason.trim()}`
      });
      
      res.json({ success: true, message: 'Transaction cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel transaction' });
    }
  });
  
  // GET all offers for the current user
  router.get("/offers", async (req, res) => {
    try {
      // Get offers where user is either buyer or seller
      const buyerOffers = await storage.getMarketplaceOffersByBuyer(MOCK_USER.id);
      const sellerOffers = await storage.getMarketplaceOffersBySeller(MOCK_USER.id);
      
      // Combine offers
      const allOffers = [...buyerOffers, ...sellerOffers];
      
      // Enhance offers with item and user details
      const enhancedOffers = await Promise.all(allOffers.map(async (offer) => {
        const item = await storage.getMarketplaceItem(offer.itemId);
        const buyer = await storage.getUserById(offer.buyerId);
        const seller = await storage.getUserById(offer.sellerId);
        
        return {
          ...offer,
          item: item ? {
            id: item.id,
            title: item.title,
            price: item.price,
            images: item.images
          } : null,
          buyerName: buyer ? buyer.name : 'Unknown Buyer',
          sellerName: seller ? seller.name : 'Unknown Seller'
        };
      }));
      
      res.json({ success: true, offers: enhancedOffers });
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch offers' });
    }
  });
  
  // POST save/unsave an item
  router.post("/items/:id/save", async (req, res) => {
    try {
      console.log('======================================');
      console.log('SAVE/UNSAVE REQUEST');
      console.log('Saving/unsaving marketplace item with ID:', req.params.id);
      console.log('Request body (raw):', req.body);
      
      const itemId = parseInt(req.params.id);
      console.log('Parsed item ID:', itemId);
      
      // Debug user object
      console.log('DEBUG: Current user ID from MOCK_USER:', MOCK_USER.id);
      console.log('DEBUG: Full MOCK_USER object:', MOCK_USER);
      
      // Check if item exists
      const item = await storage.getMarketplaceItem(itemId);
      
      if (!item) {
        console.error('Item not found with ID:', itemId);
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      console.log('Found item:', item.id, item.title);
      
      // Check if the item is already saved
      console.log('Checking if item is saved by user ID:', MOCK_USER.id);
      const savedItems = await storage.getSavedMarketplaceItemsByUser(MOCK_USER.id);
      console.log('User saved items (raw data):', JSON.stringify(savedItems, null, 2));
      
      // Print item IDs from saved items for easier debugging
      const savedItemIds = savedItems.map(saved => saved.itemId);
      console.log('User saved item IDs:', savedItemIds);
      
      const isSaved = savedItems.some(saved => saved.itemId === itemId);
      console.log('Is current item saved?', isSaved);
      
      // Get the desired saved state from the client (if provided)
      // If not provided, toggle the current state
      const clientRequestBody = req.body || {};
      console.log('Client requested saved state (raw):', clientRequestBody.saved);
      
      // If client explicitly requested a state, use that, otherwise toggle
      const shouldBeSaved = clientRequestBody.saved !== undefined 
        ? Boolean(clientRequestBody.saved) 
        : !isSaved; 
      
      console.log('Final decision - should item be saved?', shouldBeSaved, '(type:', typeof shouldBeSaved, ')');
      
      if (isSaved && !shouldBeSaved) {
        // Unsave the item
        console.log('Executing unsave operation...');
        console.log('Parameters: userId =', MOCK_USER.id, 'itemId =', itemId);
        const unsaveResult = await storage.unsaveMarketplaceItem(MOCK_USER.id, itemId);
        console.log('Unsave result:', unsaveResult);
        
        // Decrement saved count
        const currentSavedCount = item.savedCount || 0;
        const newSavedCount = Math.max(0, currentSavedCount - 1);
        console.log('Updating saved count from', currentSavedCount, 'to', newSavedCount);
        
        await storage.updateMarketplaceItem(itemId, { savedCount: newSavedCount });
        
        res.json({ success: true, saved: false, message: 'Item removed from saved items' });
      } else if (!isSaved && shouldBeSaved) {
        // Save the item
        console.log('Executing save operation...');
        const saveData = {
          itemId,
          userId: MOCK_USER.id
        };
        console.log('Save data:', saveData);
        
        try {
          const savedItem = await storage.saveMarketplaceItem(saveData);
          console.log('Item saved successfully:', savedItem);
          
          // Increment saved count
          const currentSavedCount = item.savedCount || 0;
          const newSavedCount = currentSavedCount + 1;
          console.log('Updating saved count from', currentSavedCount, 'to', newSavedCount);
          
          await storage.updateMarketplaceItem(itemId, { savedCount: newSavedCount });
          
          res.json({ success: true, saved: true, message: 'Item saved successfully' });
        } catch (saveError) {
          console.error('Error in saveMarketplaceItem:', saveError);
          res.status(500).json({ success: false, message: 'Failed to save item', error: saveError.message });
        }
      } else {
        // No change needed - item is already in the desired state
        console.log('No change needed, item is already in the desired state');
        res.json({ 
          success: true, 
          saved: isSaved, 
          message: isSaved ? 'Item is already saved' : 'Item is already not saved' 
        });
      }
      console.log('======================================');
    } catch (error) {
      console.error('Error saving/unsaving item:', error);
      res.status(500).json({ success: false, message: 'Failed to save/unsave item' });
    }
  });
  
  // GET saved items for the current user
  router.get("/saved", async (req, res) => {
    try {
      const savedItems = await storage.getSavedMarketplaceItemsByUser(MOCK_USER.id);
      
      // Get the full item details for each saved item
      const items = await Promise.all(savedItems.map(async (saved) => {
        const item = await storage.getMarketplaceItem(saved.itemId);
        if (!item) return null;
        
        // Add saved info
        return {
          ...item,
          savedByCurrentUser: true,
          savedAt: saved.createdAt
        };
      }));
      
      // Filter out null items (in case any were deleted)
      const validItems = items.filter(item => item !== null);
      
      res.json({ success: true, items: validItems });
    } catch (error) {
      console.error('Error fetching saved items:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch saved items' });
    }
  });
  
  // POST report an item
  router.post("/items/:id/report", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getMarketplaceItem(itemId);
      
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }
      
      // Get data from request
      const { reason, description } = req.body;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ success: false, message: 'Report reason is required' });
      }
      
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, message: 'Report description is required' });
      }
      
      // Create report
      const report = await storage.reportMarketplaceItem({
        itemId,
        reporterId: MOCK_USER.id,
        reason: reason.trim(),
        description: description.trim()
      });
      
      res.status(201).json({ success: true, message: 'Item reported successfully' });
    } catch (error) {
      console.error('Error reporting item:', error);
      res.status(500).json({ success: false, message: 'Failed to report item' });
    }
  });
  
  // DASHBOARD ROUTES
  
  // GET user's marketplace dashboard listings
  router.get("/dashboard/listings", async (req, res) => {
    try {
      // In a real app, get the user ID from the session
      const userId = MOCK_USER.id;
      
      // Get listings created by the user
      const listings = await storage.getMarketplaceItemsByUser(userId);
      
      res.json({ success: true, items: listings });
    } catch (error) {
      console.error('Error fetching dashboard listings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard listings' });
    }
  });
  
  // GET user's marketplace dashboard transactions
  router.get("/dashboard/transactions", async (req, res) => {
    try {
      // In a real app, get the user ID from the session
      const userId = MOCK_USER.id;
      
      // Get transactions where the user is either buyer or seller
      const transactions = await storage.getMarketplaceTransactionsByUser(userId);
      
      // Enhance transaction data with item and user info
      const enhancedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          const item = await storage.getMarketplaceItem(transaction.itemId);
          const buyer = await storage.getUserById(transaction.buyerId);
          const seller = await storage.getUserById(transaction.sellerId);
          
          return {
            ...transaction,
            item: {
              id: item?.id,
              title: item?.title || 'Unknown Item',
              description: item?.description || '',
              price: item?.price || '0',
              images: item?.images || [],
              category: item?.category || '',
              condition: item?.condition || '',
            },
            buyerName: buyer?.name || 'Unknown Buyer',
            sellerName: seller?.name || 'Unknown Seller',
          };
        })
      );
      
      res.json({ success: true, transactions: enhancedTransactions });
    } catch (error) {
      console.error('Error fetching dashboard transactions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard transactions' });
    }
  });
  
  // GET user's marketplace dashboard offers
  router.get("/dashboard/offers", async (req, res) => {
    try {
      // In a real app, get the user ID from the session
      const userId = MOCK_USER.id;
      
      // Get all offers related to the user (as buyer or seller)
      const offers = await storage.getMarketplaceOffersByUser(userId);
      
      // Enhance offer data with item and user info
      const enhancedOffers = await Promise.all(
        offers.map(async (offer) => {
          const item = await storage.getMarketplaceItem(offer.itemId);
          const buyer = await storage.getUserById(offer.buyerId);
          const seller = await storage.getUserById(offer.sellerId);
          
          return {
            ...offer,
            item: {
              id: item?.id,
              title: item?.title || 'Unknown Item',
              price: item?.price || '0',
              images: item?.images || [],
            },
            buyerName: buyer?.name || 'Unknown Buyer',
            sellerName: seller?.name || 'Unknown Seller',
          };
        })
      );
      
      res.json({ success: true, offers: enhancedOffers });
    } catch (error) {
      console.error('Error fetching dashboard offers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard offers' });
    }
  });
  
  // GET user's saved marketplace items
  router.get("/dashboard/saved", async (req, res) => {
    try {
      // In a real app, get the user ID from the session
      const userId = MOCK_USER.id;
      
      // Get saved items
      const savedItems = await storage.getSavedMarketplaceItemsByUser(userId);
      
      // Enhance saved items with item details
      const enhancedSavedItems = await Promise.all(
        savedItems.map(async (saved) => {
          const item = await storage.getMarketplaceItem(saved.itemId);
          
          return {
            ...saved,
            item: {
              id: item?.id,
              title: item?.title || 'Unknown Item',
              price: item?.price || '0',
              images: item?.images || [],
              listingStatus: item?.listingStatus || 'unknown',
            },
          };
        })
      );
      
      res.json({ success: true, items: enhancedSavedItems });
    } catch (error) {
      console.error('Error fetching saved items:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch saved items' });
    }
  });
  
  // GET user's marketplace messages
  router.get("/dashboard/messages", async (req, res) => {
    try {
      // In a real app, get the user ID from the session
      const userId = MOCK_USER.id;
      
      // Get message threads
      const messageThreads = await storage.getMarketplaceMessageThreadsByUser(userId);
      
      // Enhance message threads with item and user info
      const enhancedThreads = await Promise.all(
        messageThreads.map(async (thread) => {
          const item = await storage.getMarketplaceItem(thread.itemId);
          const sender = await storage.getUserById(thread.senderId);
          const receiver = await storage.getUserById(thread.receiverId);
          
          return {
            ...thread,
            item: {
              title: item?.title || 'Unknown Item',
              images: item?.images || [],
            },
            senderName: sender?.name || 'Unknown User',
            receiverName: receiver?.name || 'Unknown User',
          };
        })
      );
      
      res.json({ success: true, messages: enhancedThreads });
    } catch (error) {
      console.error('Error fetching message threads:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch message threads' });
    }
  });

  // ======= MARKETPLACE DASHBOARD ENDPOINTS =======

  // Get user's dashboard listings (active, pending, sold items)
  router.get("/dashboard/listings", async (req, res) => {
    try {
      // Get user ID from auth (using MOCK_USER for now)
      const userId = MOCK_USER.id;
      
      // Get all items listed by the user
      const items = await storage.getMarketplaceItemsByUser(userId);
      
      // Format response items with additional details
      const formattedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        images: item.images,
        listingStatus: item.status,
        category: item.category,
        createdAt: item.createdAt,
        viewCount: item.viewCount || 0,
        savedCount: item.savedCount || 0
      }));
      
      res.json({ success: true, items: formattedItems });
    } catch (error) {
      console.error('Error fetching dashboard listings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard listings' });
    }
  });

  // Get user's dashboard transactions (both as buyer and seller)
  router.get("/dashboard/transactions", async (req, res) => {
    try {
      // Get user ID from auth (using MOCK_USER for now)
      const userId = MOCK_USER.id;
      
      // Get transactions where the user is either buyer or seller
      const transactions = await storage.getMarketplaceTransactionsByUser(userId);
      
      // Enhance transactions with item and user details
      const enhancedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          // Get item details
          const item = await storage.getMarketplaceItem(transaction.itemId);
          
          // Get buyer details
          const buyer = await storage.getUserById(transaction.buyerId);
          
          // Get seller details
          const seller = await storage.getUserById(transaction.sellerId);
          
          return {
            id: transaction.id,
            itemId: transaction.itemId,
            buyerId: transaction.buyerId,
            sellerId: transaction.sellerId,
            status: transaction.status,
            amount: transaction.amount,
            createdAt: transaction.createdAt,
            item: {
              title: item?.title || 'Unknown Item',
              images: item?.images || []
            },
            buyerName: buyer?.name || 'Unknown User',
            sellerName: seller?.name || 'Unknown User'
          };
        })
      );
      
      res.json({ success: true, transactions: enhancedTransactions });
    } catch (error) {
      console.error('Error fetching dashboard transactions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard transactions' });
    }
  });

  // Get user's dashboard offers (both sent and received)
  router.get("/dashboard/offers", async (req, res) => {
    try {
      // Get user ID from auth (using MOCK_USER for now)
      const userId = MOCK_USER.id;
      
      // Get offers where the user is either buyer or seller
      const offers = await storage.getMarketplaceOffersByUser(userId);
      
      // Enhance offers with item and user details
      const enhancedOffers = await Promise.all(
        offers.map(async (offer) => {
          // Get item details
          const item = await storage.getMarketplaceItem(offer.itemId);
          
          // Get buyer details
          const buyer = await storage.getUserById(offer.buyerId);
          
          // Get seller details
          const seller = await storage.getUserById(offer.sellerId);
          
          return {
            id: offer.id,
            itemId: offer.itemId,
            buyerId: offer.buyerId,
            sellerId: offer.sellerId,
            amount: offer.amount,
            status: offer.status,
            createdAt: offer.createdAt,
            item: {
              title: item?.title || 'Unknown Item',
              price: item?.price || '',
              images: item?.images || []
            },
            buyerName: buyer?.name || 'Unknown User',
            sellerName: seller?.name || 'Unknown User'
          };
        })
      );
      
      res.json({ success: true, offers: enhancedOffers });
    } catch (error) {
      console.error('Error fetching dashboard offers:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard offers' });
    }
  });

  // Get user's message threads for the dashboard
  router.get("/dashboard/messages", async (req, res) => {
    try {
      // Get user ID from auth (using MOCK_USER for now)
      const userId = MOCK_USER.id;
      
      // Get message threads for the user
      const messageThreads = await storage.getMarketplaceMessageThreadsByUser(userId);
      
      res.json({ success: true, messages: messageThreads });
    } catch (error) {
      console.error('Error fetching dashboard messages:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard messages' });
    }
  });
  
  return router;
}