var express = require("express");
var router = express.Router();

router.get("/", async function (req, res, next) {});

router.post("/cancel", async function (req, res, next) {
  const { phone } = req.body;
  var lastSub = null;
  var activeSubscriptions = [];
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  while (true) {
    const response = await stripe.subscriptions.list({
      limit: 100,
      ...(lastSub && { starting_after: lastSub }),
    });
    if (response.data.length === 0) {
      break;
    }
    activeSubscriptions = activeSubscriptions.concat(response.data);
    lastSub = response.data[response.data.length - 1].id;
    if (!response.has_more) {
      break;
    }
  }
  console.log(activeSubscriptions);
  const subs_to_cancel = activeSubscriptions.filter(
    (s) => s.customer.phone === phone.replace(/\D/g, "").slice(-10)
  ).map(sub => sub.customer.id);
  console.log(subs_to_cancel);
});

router.post("/free_sign_up", async function (req, res, next) {
  const { phone, name } = req.body;
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  const customer = await stripe.customers.create({
    name,
    phone,
  });

  await sendMessage(
    "Thank you for signing up for Market Scoops Basic!",
    [phone],
    new Date()
  );
  res.json("OK");
});

router.post("/start_sub", async function (req, res, next) {
  const { phone, name, source, promoCode } = req.body;
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  const customer = await stripe.customers.create({
    name,
    phone,
  });

  const card = await stripe.customers.createSource(customer.id, { source });
  const promo_code = await stripe.promotionCodes.list({ code: promoCode });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      { price: process.env.STRIPE_PRICE_ID }, // REPLACE
    ],
    ...(promo_code && { promotion_code: promo_code.id }),
  });
  await sendMessage(
    "Thank you for signing up for Market Scoops Premium! Your payment has been processed",
    [phone],
    new Date()
  );
  res.json("OK");
});

router.post("/send_message", async function (req, res, next) {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  const { type, body, date } = req.body;

  var lastSub = null;
  var activeSubscriptions = [];
  while (true) {
    const response = await stripe.subscriptions.list({
      limit: 100,
      ...(lastSub && { starting_after: lastSub }),
    });
    if (response.data.length === 0) {
      break;
    }
    activeSubscriptions = activeSubscriptions.concat(response.data);
    lastSub = response.data[response.data.length - 1].id;
    if (!response.has_more) {
      break;
    }
  }
  const subCustomerIds = activeSubscriptions.map((r) => r.customer);

  var lastCustomer = null;
  var customers = [];
  while (true) {
    const response = await stripe.customers.list({
      limit: 1,
      ...(lastCustomer && { starting_after: lastCustomer }),
    });
    if (response.data.length === 0) {
      break;
    }
    customers = customers.concat(response.data);
    lastCustomer = response.data[response.data.length - 1].id;
    if (!response.has_more) {
      break;
    }
  }
  const allCustomerPhones = customers.map((r) => r.phone);
  const subCustomerPhones = customers
    .filter((r) => subCustomerIds.includes(r.id))
    .map((a) => a.phone);

  const freeUsers = allCustomerPhones.filter(
    (d) => !subCustomerPhones.includes(d)
  );

  console.log("allPhones", allCustomerPhones);
  console.log("subCustomerPhones", subCustomerPhones);
  console.log("freePhones", freeUsers);

  await sendMessage(
    body,
    type === "all" ? allCustomerPhones : subCustomerPhones,
    date
  );
  res.json("OK");
});

const sendMessage = async (body, userNumbers, date) => {
  const uniqNumbers = [...new Set(userNumbers)];
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_NUMBER;

  console.log(date);
  const now = new Date();
  const client = require("twilio")(accountSid, authToken);
  const secondsAgo = (new Date(date) - now) / 1000;
  console.log(secondsAgo);
  for (i = 0; i < uniqNumbers.length; i++) {
    if (secondsAgo < 3600) {
      await client.messages.create({
        body: body,
        from: twilioNumber,
        to: uniqNumbers[i],
      });
    } else {
      await client.messages.create({
        messagingServiceSid: process.env.SERVICE_SID,
        body: body,
        sendAt: date,
        scheduleType: "fixed",
        to: uniqNumbers[i],
      });
    }
  }
};

module.exports = router;
