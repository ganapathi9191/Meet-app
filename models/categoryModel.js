import mongoose from "mongoose";

// SubCategory Schema
const subCategorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
}, { timestamps: true });

// Category Schema
const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  subCategories: [subCategorySchema], // embed subcategories
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category.subCategories", required: true },
  name: { type: String, required: true },
  weight: { type: String, required: true },
  cost: { type: String, required: true },
  image: { type: String }
});

export const Category = mongoose.model("Category", categorySchema);
export const SubCategory = mongoose.model("SubCategory", subCategorySchema);
export const Item = mongoose.model("Item", itemSchema);

