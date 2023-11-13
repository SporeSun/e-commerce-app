const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');


// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [
        { model: Tag, through: ProductTag, as: 'tags' },
        { model: Category }
      ]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});


// get one product
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [
        { model: Tag, through: ProductTag, as: 'tags' },
        { model: Category }
      ]
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: product.id,
          tag_id,
        };
      });
      await ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
});

// update product
router.put('/:id', async (req, res) => {
  try {
    await Product.update(req.body, {
      where: { id: req.params.id },
    });

    if (req.body.tagIds) {
      const existingTags = await ProductTag.findAll({
        where: { product_id: req.params.id }
      });

      const existingTagIds = existingTags.map(tag => tag.tag_id);
      const newTags = req.body.tagIds.filter(tag_id => !existingTagIds.includes(tag_id));
      const tagsToRemove = existingTags.filter(tag => !req.body.tagIds.includes(tag.tag_id));

      await ProductTag.bulkCreate(newTags.map(tag_id => ({ product_id: req.params.id, tag_id })));
      await ProductTag.destroy({ where: { id: tagsToRemove.map(tag => tag.id) } });
    }

    res.status(200).json({ message: 'Product updated successfully.' });
  } catch (err) {
    res.status(400).json(err);
  }
});


router.delete('/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // First, delete associated ProductTag entries
    await ProductTag.destroy({
      where: { product_id: productId }
    });

    // Then, delete the product
    const productData = await Product.destroy({
      where: { id: productId }
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json(err);
  }
});



module.exports = router;