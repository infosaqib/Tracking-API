const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: [0, 'Level cannot be negative']
  },
  path: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  image: {
    url: String,
    alt: String
  },
  icon: String,
  color: String,
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  attributes: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect', 'date'],
      default: 'text'
    },
    options: [String], // For select/multiselect types
    isRequired: {
      type: Boolean,
      default: false
    },
    isFilterable: {
      type: Boolean,
      default: true
    },
    isSearchable: {
      type: Boolean,
      default: true
    }
  }],
  analytics: {
    productCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for full path name
categorySchema.virtual('fullPath').get(function () {
  if (this.path && this.path.length > 0) {
    return this.path.map(cat => cat.name).join(' > ') + ' > ' + this.name;
  }
  return this.name;
});

// Virtual for is leaf category
categorySchema.virtual('isLeaf').get(function () {
  return this.level > 0 && !this.children || this.children.length === 0;
});

// Indexes
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate slug
categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save middleware to update level and path
categorySchema.pre('save', async function (next) {
  if (this.isModified('parent')) {
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        this.level = parentCategory.level + 1;
        this.path = [...parentCategory.path, this.parent];
      }
    } else {
      this.level = 0;
      this.path = [];
    }
  }
  next();
});

// Instance method to get all descendants
categorySchema.methods.getDescendants = async function () {
  const descendants = [];

  const findChildren = async (categoryId) => {
    const children = await this.constructor.find({ parent: categoryId });
    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id);
    }
  };

  await findChildren(this._id);
  return descendants;
};

// Instance method to get all ancestors
categorySchema.methods.getAncestors = async function () {
  const ancestors = [];
  let current = this;

  while (current.parent) {
    current = await this.constructor.findById(current.parent);
    if (current) {
      ancestors.unshift(current);
    }
  }

  return ancestors;
};

// Instance method to move category
categorySchema.methods.moveTo = async function (newParentId) {
  const oldParent = this.parent;
  this.parent = newParentId;

  // Update level and path
  if (newParentId) {
    const newParent = await this.constructor.findById(newParentId);
    if (newParent) {
      this.level = newParent.level + 1;
      this.path = [...newParent.path, newParentId];
    }
  } else {
    this.level = 0;
    this.path = [];
  }

  await this.save();

  // Update all descendants
  const descendants = await this.getDescendants();
  for (const descendant of descendants) {
    await descendant.save(); // This will trigger the pre-save middleware
  }

  return this;
};

// Static method to get category tree
categorySchema.statics.getTree = function () {
  return this.find({ isActive: true })
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .populate('parent', 'name slug');
};

// Static method to get root categories
categorySchema.statics.getRoots = function () {
  return this.find({ parent: null, isActive: true })
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to find by slug
categorySchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

// Static method to search categories
categorySchema.statics.search = function (query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  }).sort({ name: 1 });
};

module.exports = mongoose.model('Category', categorySchema);
