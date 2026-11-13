import mongoose from "mongoose";
import Person from "./Person.js";

const { Schema } = mongoose;

const Employee = Person.discriminator("employee", new Schema({
    employeeCode: { type: String, unique: true, sparse: true },
    department: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "Employee" },
    skills: [{ type: String, trim: true }],
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "Person", default: null }
}));

export default Employee;

