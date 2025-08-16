const twilio = require("twilio");
exports.handler = async (event) => {
  try {
    const { phone, code } = JSON.parse(event.body || "{}");
    if (!phone || !code) return { statusCode: 400, body: "phone & code required" };
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: phone, code });
    const ok = check.status === "approved";
    return { statusCode: ok ? 200 : 400, body: JSON.stringify({ ok }) };
  } catch (e) {
    console.error("Twilio verify error:", e);
    return { statusCode: 500, body: e.message };
  }
};
