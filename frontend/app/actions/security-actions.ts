"use server";

export async function verifyOwnerPassword(password: string): Promise<{ success: boolean; message?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // In a real application, this would verify the password against the session user's hash
  if (password === "password" || password.length > 5) {
    return { success: true };
  }
  
  return { success: false, message: "Incorrect password. Please try again." };
}
