const { Router } = require('express');
const { asyncHandler: wrap } = require('../utils/errors');
const { requireAuth, sameUser } = require('../middleware/auth');
const users = require('../controllers/userController');
const categories = require('../controllers/categoryController');
const products = require('../controllers/productController');
const router = Router();

// Cadastro e login são públicos para permitir a obtenção do primeiro token.
router.post('/user', wrap(users.create));
router.post('/user/token', wrap(users.token));
router.get('/user/:id', wrap(users.get));
router.put('/user/:id', requireAuth, sameUser, wrap(users.update));
router.delete('/user/:id', requireAuth, sameUser, wrap(users.remove));

router.get('/category/search', wrap(categories.search));
router.get('/category/:id', wrap(categories.get));
router.post('/category', requireAuth, wrap(categories.create));
router.put('/category/:id', requireAuth, wrap(categories.update));
router.delete('/category/:id', requireAuth, wrap(categories.remove));

router.get('/product/search', wrap(products.search));
router.get('/product/:id', wrap(products.get));
router.post('/product', requireAuth, wrap(products.create));
router.put('/product/:id', requireAuth, wrap(products.update));
router.delete('/product/:id', requireAuth, wrap(products.remove));

module.exports = router;
