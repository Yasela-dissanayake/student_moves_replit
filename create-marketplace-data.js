/**
 * Script to create sample marketplace items
 * Run with: node create-marketplace-data.js
 */

// Use the fetch API to interact with our backend
const API_BASE_URL = "http://localhost:5000/api";

// Helper function for API calls
async function api(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Function to create a user if they don't exist
async function ensureUser(user) {
  try {
    // Try to get user by email first
    const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(user.email)}`);
    
    // If user is found, return it
    if (response.ok) {
      const existingUsers = await response.json();
      if (existingUsers && existingUsers.length > 0) {
        console.log(`User already exists: ${user.email}`);
        return existingUsers[0];
      }
    }
    
    // If user doesn't exist, create one
    console.log(`Creating user: ${user.email}`);
    const newUser = await api("POST", "/users", user);
    return newUser;
  } catch (error) {
    console.error(`Error ensuring user ${user.email} exists:`, error);
    throw error;
  }
}

// Create sample users first
async function createSampleUsers() {
  const users = [
    { name: "John Doe", email: "john.doe@example.com", password: "Password123", userType: "tenant", phone: "07700900123" },
    { name: "Jane Smith", email: "jane.smith@example.com", password: "Password123", userType: "tenant", phone: "07700900124" },
    { name: "Mike Johnson", email: "mike.johnson@example.com", password: "Password123", userType: "tenant", phone: "07700900125" },
    { name: "Sarah Williams", email: "sarah.williams@example.com", password: "Password123", userType: "tenant", phone: "07700900126" },
    { name: "David Brown", email: "david.brown@example.com", password: "Password123", userType: "tenant", phone: "07700900127" }
  ];
  
  console.log("Creating sample users...");
  
  const createdUsers = [];
  for (const user of users) {
    try {
      const createdUser = await ensureUser(user);
      createdUsers.push(createdUser);
    } catch (error) {
      console.error(`Failed to create user ${user.email}:`, error);
    }
  }
  
  console.log(`Created ${createdUsers.length} users`);
  return createdUsers;
}

// Create sample marketplace items
async function createMarketplaceItems() {
  // Get users first to link items to them
  const users = await createSampleUsers();
  
  // Sample marketplace items
  const items = [
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
      userId: users[0].id,
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
      userId: users[1].id,
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
      userId: users[2].id,
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
      userId: users[3].id,
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
      userId: users[4].id,
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
      userId: users[0].id,
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
      userId: users[1].id,
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
      userId: users[2].id,
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
      userId: users[3].id,
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
      userId: users[4].id,
      meetInPerson: true,
      canDeliver: true,
      listingStatus: "active"
    }
  ];
  
  console.log("Creating marketplace items...");
  
  const createdItems = [];
  for (const item of items) {
    try {
      const createdItem = await api("POST", "/marketplace/items", item);
      console.log(`Created item: ${item.title}`);
      createdItems.push(createdItem);
    } catch (error) {
      console.error(`Failed to create item ${item.title}:`, error);
    }
  }
  
  console.log(`Created ${createdItems.length} marketplace items`);
  return createdItems;
}

// Run the script
async function main() {
  try {
    const items = await createMarketplaceItems();
    console.log("Sample data creation completed successfully!");
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}

main();