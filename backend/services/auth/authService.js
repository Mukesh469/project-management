import bcrypt from "bcryptjs";
import Employee from "../../models/Employee.js";
import Manager from "../../models/Manager.js";
import Person from "../../models/Person.js";
import { AppError } from "../../utils/allUtilities.js";
import { toTitleCase } from "../../utils/titleCase.js";
import { generateAccessToken, generateRefreshToken } from "./tokenService.js";

const publicPerson = (person) => ({
  id: person._id,
  name: person.name,
  email: person.email,
  role: person.role,
});

export const registerPersonService = async (data) => {
  const { name, email, password, confirmPassword, phone, address, role } =
    data;

  if (!["manager", "employee"].includes(role)) {
    throw new AppError("Only managers and employees can be registered.", 400);
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).+$/.test(password)
  ) {
    throw new AppError(
      "Password must be at least 8 characters, at most 72 bytes, and include letters, numbers, and a special character.",
      400
    );
  }

  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match.", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await Person.findOne({ email: normalizedEmail })) {
    throw new AppError("Email already in use.", 409);
  }

  const {
    line1,
    line2 = "",
    locality = "",
    city,
    state,
    country = "India",
    pincode,
    geoLocation = {},
  } = address;

  const formattedAddress = {
    line1: toTitleCase(line1.trim()),
    line2: toTitleCase(line2.trim()),
    locality: toTitleCase(locality.trim()),
    city: toTitleCase(city.trim()),
    state: toTitleCase(state.trim()),
    country: toTitleCase(country.trim()),
    pincode: String(pincode).trim(),
    geoLocation: {
      lat: geoLocation.lat ?? null,
      lng: geoLocation.lng ?? null,
    },
  };

  const Model = role === "manager" ? Manager : Employee;

  const person = await Model.create({
    name: toTitleCase(name.trim()),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    phone,
    address: formattedAddress,
  });

  return publicPerson(person);
};

export const loginPersonService = async (data, userAgent = "", ipAddress = "") => {
  const email = data.email.trim().toLowerCase();
  const person = await Person.findOne({ email });

  if (!person || !(await bcrypt.compare(data.password, person.password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  const accessToken = generateAccessToken(person._id, person.role); // jwt token for short time 15 min 

  const refreshTokenData = await generateRefreshToken(person._id, userAgent, ipAddress); // for lonng around 7 days that gonna stored in db

  return {
    accessToken,
    refreshToken: refreshTokenData.token, // Unhashed token to send to client
    refreshTokenExpiry: refreshTokenData.expiresAt,
    person: publicPerson(person),
  };
};
