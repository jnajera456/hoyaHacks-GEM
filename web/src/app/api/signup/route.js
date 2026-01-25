import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. Get the data sent from your Ant Design form
    const body = await request.json();
    const { email, password } = body;

    console.log("Signup attempt for:", email);

    // 2. This is where you would normally save to your database
    // For now, we will simulate a successful account creation
    if (email && password) {
      // Simulate success
      return NextResponse.json(
        { message: "Account created successfully!" },
        { status: 201 }
      );
    } else {
      // Handle missing fields
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}