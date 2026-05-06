import { login } from "../../src/services/authService";
import { prismaMock } from "../__mocks__/prismaMock";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

// Mock the external cryptographic libraries
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("AuthService - login()", () => {
  const mockEmail = "admin@cit.edu";
  const mockPassword = "password123";

  const mockUser = {
    user_id: 1,
    full_name: "Admin User",
    email: mockEmail,
    password_hash: "hashed_password_string",
    role: "Admin",
    lab_id: null,
    created_at: new Date(),
    laboratories: null,
  };

  it("should successfully log in a user and return a token", async () => {
    // 1. Arrange: Tell our fake Prisma what to return when findUnique is called
    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);

    // Tell fake bcrypt that the password matches
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Tell fake jwt what token to generate
    (jwt.sign as jest.Mock).mockReturnValue("fake_jwt_token");

    // 2. Act: Call the service
    const result = await login(mockEmail, mockPassword);

    // 3. Assert: Verify the behavior
    expect(result.token).toBe("fake_jwt_token");
    expect(result.user.email).toBe(mockEmail);
    expect(result.user.role).toBe("Admin");

    // Verify Prisma was actually called with the right parameters
    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: { email: mockEmail },
      include: { laboratories: { select: { lab_name: true } } },
    });
  });

  it("should throw an error if the user is not found", async () => {
    // Arrange: Tell Prisma to return null (user doesn't exist)
    prismaMock.users.findUnique.mockResolvedValue(null);

    // Act & Assert: Expect the service to throw an error
    await expect(login("wrong@email.com", mockPassword)).rejects.toThrow(
      "Invalid credentials",
    );
  });

  it("should throw an error if the password does not match", async () => {
    // Arrange: User exists, but bcrypt says passwords don't match
    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    // Act & Assert
    await expect(login(mockEmail, "wrong_password")).rejects.toThrow(
      "Invalid credentials",
    );
  });
});
