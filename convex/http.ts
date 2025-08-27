import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api, internal } from "./_generated/api";


const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",

  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET is not set");
    }

    const body = await request.text();
    console.log("Raw body length:", body.length);

    // Convert Headers object to plain Record<string, string>
    const headersObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    console.log("Headers:", headersObj);

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, headersObj) as WebhookEvent;
    } catch (error) {
      console.error("Error verifying webhook:", error);
      return new Response("Error occurred -- invalid signature", {
        status: 400,
      });
    }

    if (evt.type === "user.created") {
      console.log("Received Clerk webhook event:", evt.type, evt.data);
      const { id, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses[0]?.email_address || "";
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.syncUser, {
          userId: id,
          email,
          name,
        });
      } catch (error) {
        console.error("Error saving user to Convex database:", error);
        return new Response("Error occurred while saving user", {
          status: 500,
        });
      }
    }

    return new Response("Webhook received and processed", {
      status: 200,
    });
  }),
});

http.route({
  path: "/lemon-squezzy-webhook",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const payloadString = await request.text();
    const signature = request.headers.get("X-signature");

    if(!signature) {
      return new Response("Missing X-Signature header", {status:400});
    }

    try {
      const payload = await _ctx.runAction(internal.lemonSqueezy.verifyWebhook, {
        payload: payloadString,
        signature
      })

      if(payload.meta.event_name === "order_created") {
        const {data} = payload;

        const result = await _ctx.runMutation(api.users.upgradeToPro, {
          email: data.attributes.user_email,
          lemonSqueezyCustomerId: data.attributes.customer_id?.toString(),
          lemonSqueezyOrderId: data.id,
          amount: String(data.attributes.total),
        });
      }

      return new Response("Webhook processed successfully", {status:200});

    } catch (error) {
      console.log("Webhook error", error)
      return new Response("Error processing Webhook", {status: 500})
    }

  }),
})

export default http;
