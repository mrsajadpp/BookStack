var express = require('express');
var router = express.Router();
let userData = require('../database/user_data')
let prodData = require('../database/product_data')
let generateOTP = require('../mail/otp')
let mail = require('../mail/mailer');
const { response } = require('express');
let fs = require('fs')

function verifyLogin(req, res, next) {
  if (req.session.status) {
    next()
  } else {
    res.redirect('/login')
  }
}
function verifyAdmin(req, res, next) {
  if (req.session.status && req.session.user.admin) {
    next()
  } else {
    res.redirect('/')
  }
}
function cartCount(req, res, next) {
  if (req.session.status) {
    prodData.getCartItems(req.session.user._id).then((cartCount) => {
      req.session.user.cartCount = cartCount
      next()
    })
  } else {
    req.session.user = {}
    req.session.user.cartCount = false
    next()
  }
}
//Home Page
router.get('/', cartCount, function (req, res, next) {
  prodData.getAllProducts().then((products) => {
    res.render('user/products', { title: 'Home', descripion: 'Electronics shopping website', style: 'products', script: 'products', products, user: req.session.user, status: req.session.status });
  })
});
//Account
router.get('/recover', (req, res, next) => {
  if (!req.session.status) {
    res.render('user/recover', { title: 'Reset Password', descripion: 'Reset your password', style: 'login', script: 'login', hide: true })
  } else {
    res.redirect('/')
  }
})
router.get('/login', (req, res) => {
  if (!req.session.status) {
    res.render('user/login', { title: 'LogIn', descripion: 'Login with your existing account', style: 'login', script: 'login', hide: true })
  } else {
    res.redirect('/')
  }
})
router.post('/login', (req, res, next) => {
  if (!req.session.status) {
    userData.findUser(req.body).then((result) => {
      req.session.status = result.loginStatus;
      req.session.user = result.user;
      res.redirect('/')
    }).catch((err) => {
      res.render('user/login', { title: 'LogIn', descripion: 'Login with your existing account', style: 'login', script: 'login', hide: true, error: 'Your entered data is not match.' })
    })
  } else {
    res.redirect('/')
  }
})
router.get('/signup', (req, res) => {
  if (!req.session.status) {
    res.render('user/signup', { title: 'SignUp', descripion: 'Create new account in basket', style: 'login', script: 'login', hide: true })
  } else {
    res.redirect('/')
  }
})
router.get('/logout', verifyLogin, (req, res) => {
  req.session.status = false
  req.session.user = null
  res.redirect('/login')
})
function otptmp(email, otp) {
  let message = {
    email: email,
    title: 'Login with your OTP.',
    text: 'Your OTP : ' + otp,
    content: `<table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
    style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
    <tr>
        <td>
            <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                align="center" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="height:80px;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="text-align:center;">

                    </td>
                </tr>
                <tr>
                    <td style="height:20px;">&nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                            style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                            <tr>
                                <td style="height:40px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td style="padding:0 35px;">
                                    <a href="https://basket.traceinc.in" title="logo" target="_blank">
                                        <img width="150" src="https://i.postimg.cc/BZxk6HqH/ybanner.png"
                                            title="logo" alt="logo">
                                    </a>
                                    <br>
                                    <h1
                                        style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif; margin-top: 30px;">
                                        Your OTP Is Ready</h1>
                                    <span
                                        style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                    <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                        Thank you for choosing Basket, Your OTP is valid for 7 minutes, Don't share with anyone.
                                    </p>
                                    <a href="javascript:void(0);"
                                        style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">OTP : ${otp}</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="height:40px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                <tr>
                    <td style="height:20px;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="text-align:center;">
                        <p
                            style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">
                            <strong>https://basket.traceinc.in</strong></p>
                    </td>
                </tr>
                <tr>
                    <td style="height:80px;">&nbsp;</td>
                </tr>
            </table>
        </td>
    </tr>
</table>`
  }
  return message;
}
router.post('/signup', async (req, res, next) => {
  let user = await {
    data: req.body,
    date: new Date(),
    otp: generateOTP()
  }
  userData.createPendingUser(user).then((uid) => {
    res.redirect('/signup/verify/' + uid._id)
    mail(otptmp(user.data.email, user.otp))
  }).catch((uid) => {
    res.redirect('/signup/verify/' + uid._id)
    mail(otptmp(uid.data.email, uid.otp))
  })
})
router.get('/signup/verify/:uid', (req, res, next) => {
  if (req.params.uid) {
    res.render('user/otp', { title: 'Otp', descripion: 'Enter your otp.', style: 'login', script: 'login', hide: true, uid: req.params.uid })
  }
})
router.post('/checkname', (req, res, next) => {
  userData.findUserName(req.body.username).then((response) => {
    res.json({ response })
  })
})
router.post('/verifyotp', (req, res, next) => {
  if (req.body.uid) {
    userData.findPendingUser(req.body.uid).then((user) => {
      if (user) {
        if (req.body.otp == user.otp) {
          userData.createUser(user._id).then((user) => {
            if (user) {
              req.session.user = user
              req.session.status = true
              res.redirect('/')
            } else {
              res.redirect('/signup')
            }
          }).catch((err) => {
            res.redirect('/login')
          })
        } else {
          res.redirect('/signup')
        }
      } else {
        res.redirect('/signup')
      }
    })
  } else {
    res.redirect('/signup')
  }
})
//Admin
router.get('/add', verifyLogin, verifyAdmin, (req, res, next) => {
  res.render('admin/addprod', { title: 'Add product', descripion: 'Add new product in basket', style: 'addprod', hide: true, user: req.session.user, status: req.session.status })
})
router.post('/add', verifyLogin, verifyAdmin, (req, res, next) => {
  try {
    if (req.body && req.files) {
      let data = req.body;
      let files = req.files;
      let product = {
        title: data.title,
        description: data.description,
        size: [],
        price: data.price,
        old_price: data.oldprice,
        delivery_charge: data.delivery,
        images: files.images.length
      }
      if (data.size) {
        console.log(data.size)
        for (let i = 0; i < data.size.length; i++) {
          product.size.push({
            type: data.size[i]
          })
        }
        console.log(product.size)
      }
      prodData.addProduct(product, (id) => {
        if (product.images > 0) {
          for (let i = 0; i < product.images; i++) {
            fs.mkdirSync('./public/images/products/' + id, { recursive: true });
            files.images[i].mv('./public/images/products/' + id + '/' + i + '.jpeg');
          }
          res.json({ status: true })
        } else {
          fs.mkdirSync('./public/images/products/' + id, { recursive: true });
          files.images.mv('./public/images/products/' + id + '/0.jpeg', (err, done) => {
            if (!err) {
              res.json({ status: true })
            } else {
              res.json({ status: false })
            }
          });
        }
      })
    }
  } catch (err) {
    console.log(err)
  }
})
router.get('/product/:prod_id', cartCount, (req, res, next) => {
  if (req.params.prod_id) {
    prodData.getProduct(req.params.prod_id).then((response) => {
      res.render('user/product', { title: response.title, descripion: response.description.slice(0, 20), style: 'product', script: 'product', product: response, user: req.session.user, status: req.session.status })
    }).catch((err) => {
      if (err) {
        res.redirect('/')
      }
    })
  }
})
module.exports = router;
