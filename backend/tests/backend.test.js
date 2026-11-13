import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Person from "../models/Person.js";
import Manager from "../models/Manager.js";
import Employee from "../models/Employee.js";
import { seedAdmin } from "../seedAdmin.js";
import app from "../server.js";

const originals = {
    connect: mongoose.connect, disconnect: mongoose.disconnect,
    findOne: Person.findOne, findById: Person.findById, updateOne: Person.updateOne,
    init: Admin.init, create: Admin.create,
    managerCreate: Manager.create, employeeCreate: Employee.create,
    secret: process.env.JWT_SECRET,
};
const env = {
    MONGO_URI: "mongodb://unused/test", ADMIN_EMAIL: "ADMIN@example.com",
    ADMIN_PASSWORD: "Test-Password1!",
};
const personId = "507f1f77bcf86cd799439011";
let existing;
let created;
let updated;
let disconnected;
let role;
let server;
let baseUrl;

before(async () => {
    process.env.JWT_SECRET = "test-secret-not-for-production";
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
    existing = null;
    created = undefined;
    updated = undefined;
    disconnected = false;
    role = "admin";
    mongoose.connect = async () => {};
    mongoose.disconnect = async () => { disconnected = true; };
    Person.findOne = async () => existing;
    Person.findById = async () => role ? { _id: personId, role } : null;
    Person.updateOne = async (...args) => { updated = args; return { modifiedCount: 1 }; };
    Admin.init = async () => {};
    Admin.create = async (data) => { created = new Admin(data); return created; };
    Manager.create = async (data) => { created = new Manager(data); return created; };
    Employee.create = async (data) => { created = new Employee(data); return created; };
});

after(async () => {
    mongoose.connect = originals.connect;
    mongoose.disconnect = originals.disconnect;
    Person.findOne = originals.findOne;
    Person.findById = originals.findById;
    Person.updateOne = originals.updateOne;
    Admin.init = originals.init;
    Admin.create = originals.create;
    Manager.create = originals.managerCreate;
    Employee.create = originals.employeeCreate;
    if (originals.secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originals.secret;
    if (server) await new Promise((resolve) => server.close(resolve));
});

const registration = {
    name: "Test Person", email: "test@example.com", password: "Test-Password1!",
    confirmPassword: "Test-Password1!", phone: "9876543210", role: "employee",
    address: { line1: "123 Example Street", city: "Delhi", state: "Delhi", pincode: "110030" },
};
const token = () => jwt.sign({ person: { id: personId, role: "admin" } }, process.env.JWT_SECRET);
const post = async (path, data, authToken) => {
    const response = await fetch(`${baseUrl}/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(data),
    });
    return { status: response.status, body: await response.json() };
};

test("seed creates an admin discriminator with a hashed password in people", async () => {
    await seedAdmin(env);
    assert.equal(created.role, "admin");
    assert.equal(Admin.collection.name, Person.collection.name);
    assert.equal(created.email, "admin@example.com");
    assert.equal(await bcrypt.compare(env.ADMIN_PASSWORD, created.password), true);
    assert.equal(created.validateSync(), undefined);
    assert.equal(disconnected, true);
});

test("seed leaves existing admins unchanged and refuses to promote other roles", async () => {
    existing = { role: "admin" };
    assert.match(await seedAdmin(env), /already exists/);
    for (const currentRole of ["manager", "employee"]) {
        existing = { role: currentRole };
        await assert.rejects(seedAdmin(env, { repairLegacy: true }), /non-admin/);
    }
    assert.equal(created, undefined);
    assert.equal(updated, undefined);
});

test("legacy repair requires explicit consent and a matching password", async () => {
    existing = { _id: personId, password: await bcrypt.hash(env.ADMIN_PASSWORD, 4) };
    await assert.rejects(seedAdmin(env), /--repair-legacy-admin/);
    await assert.rejects(seedAdmin({ ...env, ADMIN_PASSWORD: "Wrong-Password1!" }, { repairLegacy: true }), /must match/);
    assert.equal(updated, undefined);
    assert.match(await seedAdmin(env, { repairLegacy: true }), /repaired/);
    assert.deepEqual(updated[0], { _id: personId, role: null });
    assert.deepEqual(updated[1], { $set: { role: "admin" } });
    assert.equal(updated[2].overwriteDiscriminatorKey, true);
});

test("invalid seed configuration fails before connecting", async () => {
    mongoose.connect = async () => assert.fail("Must not connect");
    await assert.rejects(seedAdmin({}), /Configure/);
    await assert.rejects(seedAdmin({ ...env, ADMIN_PASSWORD: "weak" }), /ADMIN_PASSWORD/);
});

test("root responds and malformed JSON reaches the final error handler", async () => {
    assert.equal((await fetch(baseUrl)).status, 200);
    assert.equal((await fetch(`${baseUrl}/missing`)).status, 404);
    const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, "Invalid JSON body.");
});

test("only a current admin can register managers and employees", async () => {
    assert.equal((await post("register", registration)).status, 401);
    for (const currentRole of ["employee", "manager"]) {
        role = currentRole;
        assert.equal((await post("register", registration, token())).status, 403);
    }
    role = "admin";
    for (const newRole of ["manager", "employee"]) {
        const response = await post("register", { ...registration, role: newRole }, token());
        assert.equal(response.status, 201);
        assert.equal(response.body.data.role, newRole);
        assert.equal(response.body.data.password, undefined);
        assert.equal(response.body.data.authToken, undefined);
        assert.equal(created.role, newRole);
        assert.equal(await bcrypt.compare(registration.password, created.password), true);
    }
    assert.equal((await post("register", { ...registration, role: "admin" }, token())).status, 400);
});

test("seeded admin and registered managers/employees can log in", async () => {
    await seedAdmin(env);
    const accounts = [created];
    for (const newRole of ["manager", "employee"]) {
        await post("register", { ...registration, role: newRole }, token());
        accounts.push(created);
    }
    for (const account of accounts) {
        existing = account;
        const response = await post("login", { email: account.email, password: env.ADMIN_PASSWORD });
        assert.equal(response.status, 200);
        assert.equal(response.body.data.role, account.role);
        assert.equal(jwt.verify(response.body.data.authToken, process.env.JWT_SECRET).person.role, account.role);
        assert.equal(response.body.data.password, undefined);
    }
    assert.equal((await post("login", { email: existing.email, password: "wrong" })).status, 401);
});