import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // 1. Get the data sent from your Ant Design form
    const body = await request.json();
    const { email, password } = body;

    console.log("Login attempt for:", email);

    // 2. This is where you would normally check your database
    // For now, we will simulate a successful check
    if (email === "test@example.com" && password === "password123") {
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
