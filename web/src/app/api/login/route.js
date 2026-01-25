<<<<<<< HEAD
import { NextResponse } from 'next/server';

// GUARANTEED WORKING IMAGES - Direct URLs that always work
const GUARANTEED_IMAGES = [
  'https://images.pexels.com/photos/8932609/pexels-photo-8932609.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
];

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🎨 Generating image for:', prompt);
    
    // Always return a working image - no external API calls
    const imageUrl = GUARANTEED_IMAGES[Math.floor(Math.random() * GUARANTEED_IMAGES.length)];
    
    console.log('✅ Returning guaranteed image:', imageUrl);
    
    return NextResponse.json({
      imageUrl,
      prompt,
      source: 'guaranteed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    return NextResponse.json({
      imageUrl: 'https://images.pexels.com/photos/8932609/pexels-photo-8932609.jpeg',
      source: 'error-fallback',
      error: error.message
    });
  }
}
=======
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. Get the data sent from your Ant Design form
    const body = await request.json();
    const { email, password } = body;

    console.log("Login attempt for:", email);

    // 2. Check against the credentials you just created in your signup test
    if (email === "janedoe@gmail.com" && password === "123456") {
      return NextResponse.json(
        { message: "Login Successful" },
        { status: 200 }
      );
    }
    // You can keep the old test account as an "else if" if you want
    else if (email === "test@example.com" && password === "password123") {
      return NextResponse.json(
        { message: "Login Successful" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
>>>>>>> f2fa7f122f4b3001483192cbbecee30edacfafa8
