var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
const mercadopago = require("mercadopago");

//
var port = process.env.PORT || 3004
const BASE_URL = 'https://quares-fdeoliveira-mp-nodejs.herokuapp.com/';

//Config Express
var app = express();
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.static('assets'));
app.use('/assets', express.static(__dirname + '/assets'));
app.use(express.urlencoded({ extended: false }));


//MP Config
const testSeller = {
    collector_id: 469485398,
    publicKey: 'APP_USR-7eb0138a-189f-4bec-87d1-c0504ead5626',
    accessToken: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398'
};
const testBuyer = {
    id: 471923173,
    email: 'test_user_63274575@testuser.com',
    password: 'qatest2417'
};
mercadopago.configure({
    access_token: testSeller.accessToken,
    integrator_id: 'dev_24c65fb163bf11ea96500242ac130004'
});

app.get('/', function (req, res) {
    res.render('home', { mp_view: "home" });
});

app.get('/detail', function (req, res) {
    res.render('detail', Object.assign({ mp_view: "detail" }, req.query) );
});

app.post("/checkout", (req, res) => {

    const { id, description, price, unit, title, img } = req.body;
    
    const preference = {
        items: [
            {
                id: Number.parseInt(id),
                title: title,
                description: description,
                unit_price: Number.parseFloat(price),
                quantity: Number.parseInt(unit),
                picture_url: path.join(BASE_URL + img )
            }
        ],
        payer: {
            name: "Lalo",
            surname: "Landa",
            email: testBuyer.email,
            phone: {
                area_code: "11",
                number: 22223333
            },
            address: {
                zip_code: "1111",
                street_name: 'False',
                street_number: 123
            }
        },
        external_reference: "fdeoliveira@quaresitsolutions.com",
        payment_methods: {
            excluded_payment_methods: [{
                "id": "amex"
            }],
            excluded_payment_types: [{
                "id": "atm"
            }],
            installments: 6
        },
        back_urls: {
            success: BASE_URL + 'success',
            pending: BASE_URL + 'pending',
            failure: BASE_URL + 'failure'
        },
        notification_url: BASE_URL + 'notifications',
        auto_return: "approved"
    };

    mercadopago.preferences.create(preference).then(function (response) {
        //res.json({id :response.body.id})
        res.redirect(response.body.init_point);
    }).catch(function (error) {
        console.log(error);
    });
});

app.get('/success', function (req, res) {
    if (req.query.payment_id) {
        res.render('result', {
            mp_view: "success",
            tittle: "¡Gracias por elegirnos!",
            msg: "Su compra ha sido realizada exitosamente.",
            payment_info: {
                payment_id: req.query.payment_id,
                external_reference: req.query.external_reference,
                merchant_order_id: req.query.merchant_order_id
            }
        });
    } else {
        res.redirect("/");
    }
});
app.get('/pending', function (req, res) {
    if (req.query.payment_id) {
        res.render('result', {
            mp_view: "pending",
            tittle: "¡Gracias por elegirnos!",
            msg: "Su compra se encuentra pendiente.",
            payment_info: {
                payment_id: req.query.payment_id,
                external_reference: req.query.external_reference,
                merchant_order_id: req.query.merchant_order_id
            }
        });
    } else {
        res.redirect("/");
    }
});
app.get('/failure', function (req, res) {
    if (req.query.payment_id) {
        res.render('result', {
            mp_view: "failure",
            tittle: "Oppss...",
            msg: "Hubo un error al momento de realizar la compra, por favor intente otra vez.",
            payment_info: {
                payment_id: req.query.payment_id,
                external_reference: req.query.external_reference,
                merchant_order_id: req.query.merchant_order_id
            }
        });
    } else {
        res.redirect("/");
    }
});

app.post('/notifications', function (req, res) {

    fs.writeFileSync('./logs.json', JSON.stringify(req.body));

    res.json({
        Payment: req.query.payment_id,
        Status: req.query.status,
        MerchantOrder: req.query.merchant_order_id
    });
});
app.get('/showlog', function (req, res) {
    let log = require('./log.json');
    res.send(log);
});

app.listen(port);