import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = body.text || body.prompt || body.content || 'study education learning';
    
    console.log('🎨 Generating image for:', prompt);
    
    // Check if we have Pexels API key
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    
    if (pexelsApiKey) {
      // Use Pexels API - real stock photos
      const query = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${query}&per_page=10&page=1`;
      
      console.log('🔍 Searching Pexels for:', query);
      
      const response = await fetch(pexelsUrl, {
        headers: {
          'Authorization': pexelsApiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          // Pick a RANDOM photo from results
          const randomIndex = Math.floor(Math.random() * Math.min(data.photos.length, 10));
          const photo = data.photos[randomIndex];
          const imageUrl = photo.src.large || photo.src.medium;
          
          console.log('✅ Found Pexels image:', imageUrl);
          
          return NextResponse.json({
            imageUrl,
            prompt,
            source: 'pexels',
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            totalResults: data.photos.length
          });
        }
      }
    }
    
    // Fallback: Use Unsplash with random search
    console.log('🔄 Using Unsplash fallback');
    
    // Create a unique search term based on prompt and timestamp
    const searchTerms = [
      prompt.replace(/\s+/g, '-'),
      'study',
      'education',
      'learning',
      'notebook',
      'desk',
      'school'
    ];
    
    // Pick random terms for variety
    const randomTerm1 = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const randomTerm2 = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    // Use Unsplash Source API with random dimensions for variety
    const width = 600 + Math.floor(Math.random() * 400); // 600-1000px
    const height = 400 + Math.floor(Math.random() * 300); // 400-700px
    
    const unsplashUrl = `https://source.unsplash.com/featured/${width}x${height}/?${randomTerm1},${randomTerm2}`;
    
    console.log('🖼️ Unsplash URL:', unsplashUrl);
    
    return NextResponse.json({
      imageUrl: unsplashUrl,
      prompt,
      source: 'unsplash-random',
      searchTerms: [randomTerm1, randomTerm2],
      dimensions: `${width}x${height}`,
      note: 'Randomized search for variety'
    });
    
  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    // Ultimate fallback with rotation
    const fallbacks = [
      'https://images.pexels.com/photos/8932609/pexels-photo-8932609.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1456513080510-34469c6bb914?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495465798138-718f86d1a4bc?w=800&auto=format&fit=crop&q=80',
    ];
    
    // Rotate through fallbacks based on time
    const hour = new Date().getHours();
    const fallbackIndex = hour % fallbacks.length;
    
    return NextResponse.json({
      imageUrl: fallbacks[fallbackIndex],
      source: 'fallback-rotating',
      error: error.message
    });
  }
}