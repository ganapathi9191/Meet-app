import { Category, SubCategory,Item} from "../models/categoryModel.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Create Category
 */
export const createCategory = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Title and content required" });

    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
        use_filename: true,
        unique_filename: false,
      });
      imageUrl = result.secure_url;
    }

    const category = await Category.create({ title, content, image: imageUrl });
    res.status(201).json({ success: true, message: "Category created", category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all categories
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get Category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.status(200).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Category by ID
export const updateCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    let imageUrl = category.image;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
        use_filename: true,
        unique_filename: false,
      });
      imageUrl = result.secure_url;
    }

    category.title = title || category.title;
    category.content = content || category.content;
    category.image = imageUrl;

    await category.save();
    res.status(200).json({ success: true, message: "Category updated", category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Category by ID
export const deleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    await category.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};






/**
 * Create SubCategory based on Category ID
 */
export const createSubCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { title } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "Title required" });

    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "subcategories",
        use_filename: true,
        unique_filename: false,
      });
      imageUrl = result.secure_url;
    }

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    const subCategory = { title, image: imageUrl, category: category._id };
    category.subCategories.push(subCategory);
    await category.save();

    res.status(201).json({ success: true, message: "SubCategory created", subCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all subcategories by category
 */
export const getSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    res.status(200).json({ success: true, subCategories: category.subCategories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get SubCategory by ID
export const getSubCategoryById = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ success: false, message: "SubCategory not found" });

    res.status(200).json({ success: true, subCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update SubCategory by ID
export const updateSubCategoryById = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const { title } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ success: false, message: "SubCategory not found" });

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "subcategories",
        use_filename: true,
        unique_filename: false,
      });
      subCategory.image = result.secure_url;
    }

    subCategory.title = title || subCategory.title;

    await category.save();
    res.status(200).json({ success: true, message: "SubCategory updated", subCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete SubCategory by ID
export const deleteSubCategoryById = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) return res.status(404).json({ success: false, message: "SubCategory not found" });

    subCategory.remove();
    await category.save();

    res.status(200).json({ success: true, message: "SubCategory deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};




// ------------------- Create Item -------------------
export const createItem = async (req, res) => {
  try {
    const { name, weight, cost } = req.body;
    const { subCategoryId } = req.params;

    if (!name || !weight || !cost) {
      return res.status(400).json({ success: false, message: "Name, weight, and cost are required" });
    }

    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "items",
        use_filename: true,
        unique_filename: false
      });
      imageUrl = result.secure_url;
    }

    const newItem = new Item({
      subCategoryId,
      name,
      weight,
      cost,
      image: imageUrl
    });

    await newItem.save();
    res.status(201).json({ success: true, message: "Item created successfully", data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------- Get All Items by SubCategory -------------------
export const getItemsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const items = await Item.find({ subCategoryId });
    res.status(200).json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------- Get Item by ID -------------------
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------- Update Item -------------------
export const updateItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, weight, cost } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    let imageUrl = item.image;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "items",
        use_filename: true,
        unique_filename: false
      });
      imageUrl = result.secure_url;
    }

    item.name = name || item.name;
    item.weight = weight || item.weight;
    item.cost = cost || item.cost;
    item.image = imageUrl;

    await item.save();
    res.status(200).json({ success: true, message: "Item updated", data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ------------------- Delete Item -------------------
export const deleteItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    await item.deleteOne();
    res.status(200).json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};