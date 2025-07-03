-- Insert marketplace items directly
INSERT INTO marketplace_items (
  title, description, price, category, condition, status, images, location, 
  seller_id, university
) 
VALUES 
(
  'Economics Textbook - Principles of Microeconomics',
  '7th Edition, Gregory Mankiw. Excellent condition with minimal highlighting. Perfect for first-year economics students.',
  45.00,
  'textbooks',
  'very_good',
  'available',
  '["https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800", "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=800"]',
  'University of Leeds',
  1,
  'University of Leeds'
),
(
  'MacBook Pro 2023 - M2 Chip',
  '13-inch MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Purchased last semester, selling because I''m upgrading. Comes with charger and protective case.',
  899.99,
  'electronics',
  'like_new',
  'available',
  '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800"]',
  'University of Manchester',
  2,
  'University of Manchester'
),
(
  'IKEA Student Desk - White',
  'IKEA MICKE desk in white, perfect for students. Assembled but in excellent condition. Has a drawer for storage. Pick up only from my apartment near campus.',
  50.00,
  'furniture',
  'good',
  'available',
  '["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800"]',
  'London Metropolitan University',
  2,
  'London Metropolitan University'
),
(
  'Graphing Calculator - Texas Instruments TI-84',
  'TI-84 Plus graphing calculator. Required for many math and science courses. Works perfectly. Includes batteries and case.',
  75.00,
  'electronics',
  'good',
  'available',
  '["https://images.unsplash.com/photo-1564141857893-c8bd663e3fdf?auto=format&fit=crop&q=80&w=800"]',
  'University of Birmingham',
  1,
  'University of Birmingham'
),
(
  'Mini Refrigerator - Perfect for Dorms',
  'Compact 3.2 cubic feet mini fridge. Great for dorm rooms or small spaces. Energy-efficient and quiet. Used for one year but works perfectly.',
  85.00,
  'kitchen',
  'good',
  'available',
  '["https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=800"]',
  'University of Bristol',
  1,
  'University of Bristol'
),
(
  'Nike Running Shoes - Men''s Size 10',
  'Nike Air Zoom Pegasus 38, men''s size 10. Only worn a few times, still in great condition. Black with white swoosh.',
  65.00,
  'clothing',
  'very_good',
  'available',
  '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"]',
  'University of Edinburgh',
  2,
  'University of Edinburgh'
);