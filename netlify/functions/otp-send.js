const twilio = require("twilio");
exports.handler = async (event) => {
  try {
    const { phone, locale = "en" } = JSON.parse(event.body || "{}");
    if (!phone) return { statusCode: 400, body: "phone required" };
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms", locale });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) { 
    console.error("Twilio send error:", e);
    return { statusCode: 500, body: e.message }; 
  }
};
