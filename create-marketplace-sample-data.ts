/**
 * Script to create sample marketplace items directly in the storage
 * Run with: npx tsx create-marketplace-sample-data.ts
 */

// Import the storage from the server
import { storage } from './server/storage';
import { MarketplaceItem, MarketplaceTransaction, MarketplaceOffer, TransactionMessage, SavedMarketplaceItem } from './shared/schema';

// Sample marketplace item data
const sampleMarketplaceItems = [
  {
    title: "Economics Textbook - Principles of Microeconomics",
    description: "7th Edition, Gregory Mankiw. Excellent condition with minimal highlighting. Perfect for first-year economics students.",
    price: "45.00",
    category: "textbooks",
    condition: "very_good",
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Leeds",
    tags: ["economics", "textbook", "microeconomics"],
    userId: 1,
    meetInPerson: true,
    canDeliver: true,
    listingStatus: "active"
  },
  {
    title: "MacBook Pro 2023 - M2 Chip",
    description: "13-inch MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Purchased last semester, selling because I'm upgrading. Comes with charger and protective case.",
    price: "899.99",
    category: "electronics",
    condition: "like_new",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Manchester",
    tags: ["laptop", "apple", "macbook", "computer"],
    userId: 2,
    meetInPerson: true,
    canDeliver: false,
    listingStatus: "active"
  },
  {
    title: "IKEA Student Desk - White",
    description: "IKEA MICKE desk in white, perfect for students. Assembled but in excellent condition. Has a drawer for storage. Pick up only from my apartment near campus.",
    price: "50.00",
    category: "furniture",
    condition: "good",
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800"
    ],
    location: "London Metropolitan University",
    tags: ["desk", "furniture", "ikea", "student"],
    userId: 3,
    meetInPerson: true,
    canDeliver: false,
    listingStatus: "active"
  },
  {
    title: "Graphing Calculator - Texas Instruments TI-84",
    description: "TI-84 Plus graphing calculator. Required for many math and science courses. Works perfectly. Includes batteries and case.",
    price: "75.00",
    category: "electronics",
    condition: "good",
    images: [
      "https://images.unsplash.com/photo-1564141857893-c8bd663e3fdf?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Birmingham",
    tags: ["calculator", "math", "science", "engineering"],
    userId: 4,
    meetInPerson: true,
    canDeliver: true,
    listingStatus: "active"
  },
  {
    title: "Mini Refrigerator - Perfect for Dorms",
    description: "Compact 3.2 cubic feet mini fridge. Great for dorm rooms or small spaces. Energy-efficient and quiet. Used for one year but works perfectly.",
    price: "85.00",
    category: "kitchen",
    condition: "good",
    images: [
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Bristol",
    tags: ["fridge", "appliance", "dorm", "kitchen"],
    userId: 5,
    meetInPerson: true,
    canDeliver: false,
    listingStatus: "active"
  },
  {
    title: "Nike Running Shoes - Men's Size 10",
    description: "Nike Air Zoom Pegasus 38, men's size 10. Only worn a few times, still in great condition. Black with white swoosh.",
    price: "65.00",
    category: "clothing",
    condition: "very_good",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Edinburgh",
    tags: ["shoes", "nike", "running", "athletic"],
    userId: 1,
    meetInPerson: true,
    canDeliver: true,
    listingStatus: "active"
  },
  {
    title: "Advanced Statistics Tutoring",
    description: "Offering statistics tutoring for undergraduate and graduate students. PhD candidate in Statistics with 3 years of teaching experience. £25/hour or discounted packages available.",
    price: "25.00",
    category: "services",
    condition: "new",
    images: [
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University College London",
    tags: ["tutoring", "statistics", "math", "academic"],
    userId: 2,
    meetInPerson: true,
    canDeliver: false,
    listingStatus: "active"
  },
  {
    title: "Concert Tickets - Coldplay at Wembley",
    description: "2 tickets to Coldplay's Music of the Spheres tour at Wembley Stadium. Saturday, June 15th, 2025. Section 124, Row 23. Selling at face value because I can no longer attend.",
    price: "190.00",
    category: "tickets",
    condition: "new",
    images: [
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=800"
    ],
    location: "Imperial College London",
    tags: ["concert", "music", "coldplay", "tickets"],
    userId: 3,
    meetInPerson: true,
    canDeliver: false,
    listingStatus: "active"
  },
  {
    title: "Portable Bluetooth Speaker - JBL Flip 5",
    description: "JBL Flip 5 waterproof portable Bluetooth speaker. Great sound quality and battery life. Includes charging cable. Used but in excellent condition.",
    price: "60.00",
    category: "electronics",
    condition: "very_good",
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of Oxford",
    tags: ["speaker", "bluetooth", "music", "audio"],
    userId: 4,
    meetInPerson: true,
    canDeliver: true,
    listingStatus: "active"
  },
  {
    title: "Electric Kettle - Russell Hobbs",
    description: "1.7L electric kettle, fast boiling and energy efficient. Perfect for making tea, coffee, or instant noodles in your dorm or flat.",
    price: "15.00",
    category: "kitchen",
    condition: "good",
    images: [
      "https://images.unsplash.com/photo-1575377427642-087fc0717143?auto=format&fit=crop&q=80&w=800"
    ],
    location: "University of York",
    tags: ["kettle", "kitchen", "appliance", "electric"],
    userId: 5,
    meetInPerson: true,
    canDeliver: true,
    listingStatus: "active"
  }
];

// Sample marketplace transactions
const sampleTransactions = [
  {
    itemId: 2, // MacBook Pro
    buyerId: 3,
    sellerId: 2,
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    paymentReceipt: "https://images.unsplash.com/photo-1554224155-8d04cb21ed6c?auto=format&fit=crop&q=80&w=800",
    deliveryMethod: "pickup",
    deliveryStatus: "delivered",
    deliveryProof: "https://images.unsplash.com/photo-1586769852836-bc069f19e1dc?auto=format&fit=crop&q=80&w=800",
    amount: "870.00", // Negotiated price
    notes: "Smooth transaction, buyer was very responsive.",
    completedAt: new Date(2025, 3, 2), // April 2, 2025
  },
  {
    itemId: 4, // Graphing Calculator
    buyerId: 1,
    sellerId: 4,
    status: "in_progress",
    paymentStatus: "paid",
    paymentMethod: "card_payment",
    paymentReceipt: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=800",
    deliveryMethod: "delivery",
    deliveryStatus: "in_transit",
    deliveryTrackingNumber: "RM12345678GB",
    amount: "75.00",
    notes: "Shipped via Royal Mail, tracking provided.",
  },
  {
    itemId: 6, // Nike Running Shoes
    buyerId: 5,
    sellerId: 1,
    status: "pending",
    paymentStatus: "pending",
    deliveryMethod: "pickup",
    deliveryStatus: "pending",
    amount: "60.00", // Negotiated price
    notes: "Meeting arranged for next week at university library.",
  }
];

// Sample transaction messages
const sampleTransactionMessages = [
  {
    transactionId: 1,
    senderId: 3, // buyer
    senderType: "buyer",
    message: "Hi, I've received the MacBook and everything works perfectly. Thanks for packaging it so carefully!",
  },
  {
    transactionId: 1,
    senderId: 2, // seller
    senderType: "seller",
    message: "You're welcome! Enjoy your new laptop. Please don't hesitate to reach out if you have any questions about it.",
  },
  {
    transactionId: 1,
    senderId: 0, // system
    senderType: "system",
    message: "Transaction completed successfully. Funds have been released to the seller.",
  },
  {
    transactionId: 2,
    senderId: 1, // buyer
    senderType: "buyer",
    message: "Hi, just confirming that I've made the payment. Looking forward to receiving the calculator!",
  },
  {
    transactionId: 2,
    senderId: 4, // seller
    senderType: "seller",
    message: "Thanks for your prompt payment! I've shipped the calculator today via Royal Mail. Here's the tracking number: RM12345678GB",
  },
  {
    transactionId: 3,
    senderId: 5, // buyer
    senderType: "buyer",
    message: "Hello, I'm interested in buying your Nike shoes. Can we meet at the university library next Tuesday at 2pm?",
  },
  {
    transactionId: 3,
    senderId: 1, // seller
    senderType: "seller",
    message: "That works for me. I'll see you next Tuesday at 2pm at the library entrance. The shoes will be in their original box.",
  }
];

// Sample marketplace offers
const sampleOffers = [
  {
    itemId: 3, // IKEA Desk
    buyerId: 2,
    sellerId: 3,
    amount: "45.00", // Offering less than asking price
    note: "Would you accept £45 for the desk? I can pick it up tomorrow.",
    status: "pending",
    expiresAt: new Date(2025, 4, 15), // May 15, 2025
  },
  {
    itemId: 8, // Concert Tickets
    buyerId: 4,
    sellerId: 3,
    amount: "180.00", // Offering less than asking price
    note: "Hi! I can offer £180 for both tickets if you're willing to meet near campus.",
    status: "rejected",
    expiresAt: new Date(2025, 4, 10), // May 10, 2025
  },
  {
    itemId: 10, // Electric Kettle
    buyerId: 1,
    sellerId: 5,
    amount: "12.00", // Offering less than asking price
    note: "Would you take £12 for the kettle? I can collect it anytime this week.",
    status: "accepted",
    expiresAt: new Date(2025, 4, 20), // May 20, 2025
  }
];

// Sample saved marketplace items
const sampleSavedItems = [
  {
    itemId: 1, // Economics Textbook
    userId: 2
  },
  {
    itemId: 5, // Mini Refrigerator
    userId: 1
  },
  {
    itemId: 7, // Statistics Tutoring
    userId: 3
  },
  {
    itemId: 9, // Bluetooth Speaker
    userId: 2
  }
];

// Function to create sample users if they don't exist
async function ensureSampleUsers() {
  console.log("Ensuring sample users exist...");
  
  const sampleUsers = [
    { name: "John Doe", email: "john.doe@example.com", password: "Password123", userType: "tenant", phone: "07700900123" },
    { name: "Jane Smith", email: "jane.smith@example.com", password: "Password123", userType: "tenant", phone: "07700900124" },
    { name: "Mike Johnson", email: "mike.johnson@example.com", password: "Password123", userType: "tenant", phone: "07700900125" },
    { name: "Sarah Williams", email: "sarah.williams@example.com", password: "Password123", userType: "tenant", phone: "07700900126" },
    { name: "David Brown", email: "david.brown@example.com", password: "Password123", userType: "tenant", phone: "07700900127" }
  ];
  
  for (let i = 0; i < sampleUsers.length; i++) {
    const user = sampleUsers[i];
    
    // Check if user with this email already exists
    const existingUser = await storage.getUserByEmail(user.email);
    
    if (!existingUser) {
      // Create the user
      console.log(`Creating user: ${user.email}`);
      await storage.createUser(user);
    } else {
      console.log(`User already exists: ${user.email} (ID: ${existingUser.id})`);
    }
  }
  
  console.log("Sample users created or verified.");
}

// Function to create sample marketplace items
async function createSampleMarketplaceItems() {
  console.log("Creating sample marketplace items...");
  
  // Create each marketplace item
  for (const item of sampleMarketplaceItems) {
    try {
      await storage.createMarketplaceItem(item);
      console.log(`Created item: ${item.title}`);
    } catch (error) {
      console.error(`Error creating item "${item.title}":`, error);
    }
  }
  
  console.log("All sample marketplace items created.");
}

// Function to create sample transactions
async function createSampleTransactions() {
  console.log("Creating sample transactions...");
  
  // Create each transaction
  for (const transaction of sampleTransactions) {
    try {
      const newTransaction = await storage.createMarketplaceTransaction(transaction);
      console.log(`Created transaction for item ID ${transaction.itemId} between buyer ${transaction.buyerId} and seller ${transaction.sellerId}`);
      
      // If the transaction is completed, mark the item as sold
      if (transaction.status === "completed") {
        await storage.markItemAsSold(transaction.itemId, transaction.buyerId);
        console.log(`Marked item ID ${transaction.itemId} as sold to buyer ${transaction.buyerId}`);
      }
    } catch (error) {
      console.error(`Error creating transaction for item ${transaction.itemId}:`, error);
    }
  }
  
  console.log("All sample transactions created.");
}

// Function to create sample transaction messages
async function createSampleTransactionMessages() {
  console.log("Creating sample transaction messages...");
  
  // Create each transaction message
  for (const message of sampleTransactionMessages) {
    try {
      await storage.createTransactionMessage(message);
      console.log(`Created message for transaction ID ${message.transactionId} from ${message.senderType}`);
    } catch (error) {
      console.error(`Error creating message for transaction ${message.transactionId}:`, error);
    }
  }
  
  console.log("All sample transaction messages created.");
}

// Function to create sample offers
async function createSampleOffers() {
  console.log("Creating sample offers...");
  
  // Create each offer
  for (const offer of sampleOffers) {
    try {
      await storage.createMarketplaceOffer(offer);
      console.log(`Created offer for item ID ${offer.itemId} from buyer ${offer.buyerId} with status "${offer.status}"`);
    } catch (error) {
      console.error(`Error creating offer for item ${offer.itemId}:`, error);
    }
  }
  
  console.log("All sample offers created.");
}

// Function to create sample saved items
async function createSampleSavedItems() {
  console.log("Creating sample saved items...");
  
  // Create each saved item
  for (const savedItem of sampleSavedItems) {
    try {
      await storage.saveMarketplaceItem(savedItem);
      console.log(`Added item ID ${savedItem.itemId} to user ${savedItem.userId}'s saved items`);
    } catch (error) {
      console.error(`Error saving item ${savedItem.itemId} for user ${savedItem.userId}:`, error);
    }
  }
  
  console.log("All sample saved items created.");
}

// Main function to run everything
async function main() {
  try {
    console.log("Starting to create sample marketplace data...");
    
    // Create sample users (or verify they exist)
    await ensureSampleUsers();
    
    // Create marketplace items
    await createSampleMarketplaceItems();
    
    // Create transactions and related data
    await createSampleTransactions();
    await createSampleTransactionMessages();
    
    // Create offers
    await createSampleOffers();
    
    // Create saved items
    await createSampleSavedItems();
    
    console.log("All sample marketplace data created successfully!");
  } catch (error) {
    console.error("An error occurred while creating sample data:", error);
  }
}

// Run the main function
main()
  .then(() => console.log("Finished"))
  .catch(err => console.error("Fatal error:", err));