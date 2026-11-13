import mongoose from "mongoose";
import  Person  from "./Person.js";

const { Schema } = mongoose;

const Manager = Person.discriminator("manager", new Schema({
    employeeCode: { type: String, unique: true, sparse: true },
    department: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "Project Manager" }
}));

export default Manager;