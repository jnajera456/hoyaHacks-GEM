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
