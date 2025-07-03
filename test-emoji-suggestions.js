/**
 * Test script for the emoji suggestions feature
 * Run with Node.js: node test-emoji-suggestions.js
 */

async function testEmojiSuggestions() {
  const testMessages = [
    "I'm so happy today!",
    "That's really sad news.",
    "I love this new feature",
    "Happy birthday to you!",
    "Let's meet for lunch tomorrow",
    "I'm studying for my exams",
    "The weather is nice today",
    "Congratulations on your promotion!"
  ];

  console.log('🧪 Testing emoji suggestions API endpoint...\n');

  for (const message of testMessages) {
    try {
      console.log(`Testing message: "${message}"`);
      
      const response = await fetch('http://localhost:5000/api/chat/test-emoji-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Suggested emojis: ${data.suggestions.join(' ')}`);
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`);
        const errorData = await response.text();
        console.log(errorData);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('-----------------------------------');
  }
}

// Run the test
testEmojiSuggestions().catch(error => {
  console.error('Test failed:', error);
});